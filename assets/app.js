'use strict';

const app = document.querySelector('#app');
const API = window.CINEGO_API_URL.replace(/\/$/, '');
const money = value => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const date = value => new Intl.DateTimeFormat('vi-VN', {day:'2-digit', month:'2-digit', year:'numeric', timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value));
const time = value => new Intl.DateTimeFormat('vi-VN', {hour:'2-digit', minute:'2-digit', hourCycle:'h23', timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(value));
let screenVersion = 0;
let activeShowtime = null;
let receipt = null;

async function api(path, data) {
    let response;
    try {
        response = await fetch(API + path, {
            method: data === undefined ? 'GET' : 'POST',
            headers: {Accept:'application/json', ...(data === undefined ? {} : {'Content-Type':'application/json'})},
            ...(data === undefined ? {} : {body:JSON.stringify(data)}),
            cache:'no-store',
        });
    } catch {
        throw new Error('Không kết nối được máy chủ. Kiểm tra backend đang chạy ở cổng 8000 và cấu hình API/CORS.');
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = body.errors ? Object.values(body.errors).flat().join(' ') : response.status === 404 ? 'Không tìm thấy phim hoặc suất chiếu đã hết hạn.' : response.status === 429 ? 'Bạn thao tác quá nhanh. Vui lòng thử lại sau một phút.' : 'Máy chủ gặp lỗi. Vui lòng thử lại.';
        throw new Error(message);
    }
    return body.data;
}

function poster(movie, detail = false) {
    const art = ['horizon','ocean','summer','stars'].includes(movie.art) ? movie.art : 'horizon';
    return `<div class="poster ${detail ? 'detail-poster' : ''} ${art}"><span class="rating">${escapeHtml(movie.rating)}</span><div class="poster-orb"></div><div class="poster-land"></div><span class="poster-label">CINEGO ORIGINAL STORIES</span><strong>${escapeHtml(movie.title)}</strong><span class="poster-bottom">CHẠM ĐẾN NHỮNG CẢM XÚC MỚI</span></div>`;
}

function home(movies, search) {
    return `<section class="hero"><div class="hero-copy"><span class="eyebrow">HẸN NHAU Ở RẠP PHIM</span><h1>Tắt bộn bề.<br>Bật <em>cảm xúc.</em></h1><p>Một bộ phim hay, một chỗ ngồi vừa ý.<br>Buổi hẹn điện ảnh của bạn bắt đầu từ đây.</p><button class="button" data-action="explore">Khám phá phim</button><div class="hero-caption"><span>2D DIGITAL</span><span>Âm thanh sống động</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="planet"></div><div class="mountain back"></div><div class="mountain front"></div><div class="art-caption">BEYOND<br><b>THE HORIZON</b><small>MỘT HÀNH TRÌNH MỚI ĐANG CHỜ</small></div></div></section>
    <section class="movies-section" id="movies"><div class="section-heading"><div><span class="eyebrow">LÊN LỊCH CHO MỘT BUỔI TỐI HAY</span><h2>Phim đang chiếu<span class="count">${movies.length}</span></h2></div><form class="search" id="search-form"><label class="sr-only" for="q">Tìm phim</label><input id="q" name="q" value="${escapeHtml(search)}" placeholder="Tìm tên phim…" maxlength="100"><button>Tìm kiếm</button></form></div><div class="movie-grid">
    ${movies.map(movie => `<article class="movie-card"><a href="#/movies/${movie.id}" aria-label="Xem ${escapeHtml(movie.title)}">${poster(movie)}</a><div class="movie-meta">${escapeHtml(movie.genre)}<span>${movie.duration} phút</span></div><h3><a href="#/movies/${movie.id}">${escapeHtml(movie.title)}</a></h3><a class="button button-outline full" href="#/movies/${movie.id}">Đặt vé ngay</a></article>`).join('') || '<div class="empty"><h3>Chưa tìm thấy phim</h3><p>Thử tìm tên khác hoặc xem tất cả phim.</p><a class="button" href="#/">Xem tất cả phim</a></div>'}</div></section>
    <section class="steps-banner"><div><span class="step-num">01</span><div><h3>Chọn phim yêu thích</h3><p>Khám phá câu chuyện tiếp theo.</p></div></div><div><span class="step-num">02</span><div><h3>Chọn chỗ ngồi của bạn</h3><p>Suất chiếu và vị trí vừa ý.</p></div></div><div><span class="step-num">03</span><div><h3>Sẵn sàng thưởng thức</h3><p>Lưu mã vé, thanh toán tại quầy.</p></div></div></section>`;
}

function moviePage(movie) {
    const days = new Map();
    movie.showtimes.forEach(showtime => {
        const day = date(showtime.starts_at);
        if (!days.has(day)) days.set(day, []);
        days.get(day).push(showtime);
    });
    return `<a class="back-link" href="#/">Phim đang chiếu / Chi tiết phim</a><section class="detail">${poster(movie, true)}<div><span class="eyebrow">ĐANG CHIẾU · 2D DIGITAL</span><h1>${escapeHtml(movie.title)}</h1><div class="tags"><span>${escapeHtml(movie.genre)}</span><span>${movie.duration} phút</span><span>${escapeHtml(movie.rating)}</span><span>Tiếng Việt</span></div><p class="description">${escapeHtml(movie.description)}</p><h2>Chọn suất chiếu</h2><p class="muted">CineGo Cinema · Thanh toán tại quầy</p><div class="showtime-list">${[...days].map(([day, shows]) => `<div class="day"><h3>${day}</h3><div class="time-options">${shows.map(show => `<a class="time-option" href="#/showtimes/${show.id}"><strong>${time(show.starts_at)}</strong><small>${escapeHtml(show.room)} · ${money(show.price)}</small></a>`).join('')}</div></div>`).join('') || '<p class="empty">Chưa có suất chiếu sắp tới.</p>'}</div></div></section>`;
}

function seatsPage(show) {
    const rows = [...'ABCDEF'].map(row => `<div class="seat-row"><span class="row-label">${row}</span>${Array.from({length:8}, (_, index) => {
        const seat = row + (index + 1);
        const taken = show.occupied.includes(seat);
        return `<label class="seat ${taken ? 'taken' : ''}"><input type="checkbox" name="seats" value="${seat}" aria-label="Ghế ${seat}${taken ? ', đã đặt' : ''}" ${taken ? 'disabled' : ''}><span>${seat}</span></label>`;
    }).join('')}<span class="row-label">${row}</span></div>`).join('');
    return `<a class="back-link" href="#/movies/${show.movie.id}">${escapeHtml(show.movie.title)} / Chọn ghế</a><div class="section-heading"><div><span class="eyebrow">CHỖ NGỒI ĐẸP, TRẢI NGHIỆM HAY</span><h1>Chọn ghế của bạn</h1></div><span class="muted">Tối đa 8 ghế mỗi lần đặt</span></div><div id="form-error" role="alert"></div><form id="booking-form" class="booking-layout"><section class="panel seat-panel"><div class="screen">MÀN HÌNH</div><div class="seat-map" role="group" aria-label="Sơ đồ ghế">${rows}</div><div class="legend"><span><i></i>Còn trống</span><span><i class="selected"></i>Đang chọn</span><span><i class="taken"></i>Đã đặt</span></div><p class="muted center">Ghế chỉ được giữ khi bạn xác nhận đặt vé thành công.</p></section><aside class="panel booking-summary"><span class="eyebrow">THÔNG TIN ĐẶT VÉ</span><h2>${escapeHtml(show.movie.title)}</h2><p class="muted">${escapeHtml(show.room)} · ${time(show.starts_at)}, ${date(show.starts_at)}</p><div class="summary-line"><span>Ghế đã chọn</span><strong id="selected-seats">Chưa chọn</strong></div><div class="summary-line total"><span>Tổng tiền</span><strong id="total">0 ₫</strong></div><label for="customer_name">Họ và tên</label><input id="customer_name" name="customer_name" autocomplete="name" required maxlength="100" placeholder="Nhập họ tên của bạn"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="255" placeholder="ban@example.com"><label for="phone">Số điện thoại</label><input id="phone" name="phone" type="tel" autocomplete="tel" required pattern="0[0-9]{9}" maxlength="10" placeholder="09xxxxxxxx"><button class="button full" type="submit">Xác nhận đặt vé</button><p class="muted small">Thanh toán tại quầy. Vui lòng đến trước giờ chiếu 15 phút.</p></aside></form>`;
}

function lookupPage() {
    return `<section class="lookup"><span class="eyebrow">BUỔI HẸN ĐIỆN ẢNH CỦA BẠN</span><h1>Tra cứu vé</h1><p class="muted">Nhập mã đặt vé và email đã dùng khi đặt. Nếu vừa tải lại trang vé, hãy tra cứu để xem lại.</p><div id="form-error" role="alert"></div><form id="lookup-form" class="panel"><label for="code">Mã đặt vé</label><input id="code" name="code" required maxlength="36" placeholder="Mã hiển thị trên vé của bạn"><label for="email">Email đặt vé</label><input id="email" name="email" type="email" required maxlength="255" placeholder="ban@example.com"><button class="button full">Tìm vé của tôi</button></form></section>`;
}

function ticketPage(booking) {
    return `<section class="ticket-wrap"><div class="success-icon">✓</div><span class="eyebrow">BUỔI HẸN ĐÃ SẴN SÀNG</span><h1>Thông tin vé của bạn</h1><p class="muted">Lưu mã vé và xuất trình tại quầy để thanh toán, nhận vé.</p><article class="panel ticket"><div class="ticket-top"><span class="brand">Cine<span>Go</span></span><span class="badge">Chờ thanh toán tại quầy</span></div><h2>${escapeHtml(booking.showtime.movie.title)}</h2><div class="ticket-details"><div><span>Suất chiếu</span><strong>${time(booking.showtime.starts_at)} · ${date(booking.showtime.starts_at)}</strong></div><div><span>Phòng chiếu</span><strong>${escapeHtml(booking.showtime.room)} · 2D</strong></div><div><span>Ghế ngồi</span><strong>${escapeHtml(booking.seats.join(', '))}</strong></div><div><span>Khách hàng</span><strong>${escapeHtml(booking.customer_name)}</strong></div></div><div class="summary-line total"><span>Tổng thanh toán</span><strong>${money(booking.total)}</strong></div><div class="ticket-code"><span>MÃ ĐẶT VÉ</span><code>${escapeHtml(booking.code)}</code><small>Giữ lại mã vé để tra cứu. Hệ thống demo chưa gửi email.</small></div></article><div class="ticket-actions"><button class="button" data-action="print">In / lưu vé PDF</button><a class="button button-outline" href="#/">Khám phá phim khác</a></div></section>`;
}

async function render() {
    const version = ++screenVersion;
    const route = (location.hash.slice(1) || '/').split('?')[0];
    const search = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
    document.querySelector('#nav-movies').classList.toggle('active', !['/lookup','/ticket'].includes(route));
    document.querySelector('#nav-lookup').classList.toggle('active', ['/lookup','/ticket'].includes(route));
    app.innerHTML = '<p class="empty" role="status">Đang tải…</p>';
    activeShowtime = null;
    try {
        let html;
        if (route === '/') html = home(await api('/movies?q=' + encodeURIComponent(search)), search);
        else if (/^\/movies\/\d+$/.test(route)) html = moviePage(await api(route));
        else if (/^\/showtimes\/\d+$/.test(route)) {
            const showtime = await api(route);
            if (version !== screenVersion) return;
            activeShowtime = showtime;
            html = seatsPage(showtime);
        } else if (route === '/ticket' && receipt) html = ticketPage(receipt);
        else if (route === '/lookup' || route === '/ticket') html = lookupPage();
        else html = '<section class="empty"><h1>Không tìm thấy trang</h1><a class="button" href="#/">Về trang chủ</a></section>';
        if (version !== screenVersion) return;
        app.innerHTML = html;
        window.scrollTo(0, 0);
    } catch (error) {
        if (version === screenVersion) app.innerHTML = `<section class="empty"><h2>Chưa tải được dữ liệu</h2><p>${escapeHtml(error.message)}</p><button class="button" data-action="retry">Thử lại</button> <a class="button button-outline" href="#/">Về trang chủ</a></section>`;
    }
}

function updateSeats() {
    if (!activeShowtime) return;
    const boxes = [...app.querySelectorAll('input[name="seats"]')];
    const selected = boxes.filter(box => box.checked);
    document.querySelector('#selected-seats').textContent = selected.map(box => box.value).join(', ') || 'Chưa chọn';
    document.querySelector('#total').textContent = money(selected.length * activeShowtime.price);
    boxes.forEach(box => { box.disabled = box.closest('.taken') !== null || (selected.length >= 8 && !box.checked); });
}

function formError(message) {
    const target = document.querySelector('#form-error');
    if (!target) return;
    target.className = 'alert';
    target.textContent = message;
    target.scrollIntoView({block:'center'});
}

app.addEventListener('change', event => { if (event.target.name === 'seats') updateSeats(); });
app.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'print') window.print();
    if (action === 'retry') render();
    if (action === 'explore') document.querySelector('#movies')?.scrollIntoView({behavior:'smooth'});
});
app.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    const values = new FormData(form);
    if (form.id === 'search-form') {
        const hash = '#/?q=' + encodeURIComponent(String(values.get('q')).trim());
        if (location.hash === hash) render(); else location.hash = hash;
        return;
    }
    const version = screenVersion;
    const showtime = activeShowtime;
    const button = form.querySelector('button[type="submit"], button');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Đang xử lý…';
    try {
        let result;
        if (form.id === 'booking-form') {
            const seats = values.getAll('seats');
            if (!seats.length) throw new Error('Vui lòng chọn ít nhất một ghế.');
            result = await api(`/showtimes/${showtime.id}/bookings`, {...Object.fromEntries(values), seats});
        } else result = await api('/bookings/lookup', Object.fromEntries(values));
        receipt = result;
        if (version === screenVersion) {
            if (location.hash === '#/ticket') render(); else location.hash = '#/ticket';
        }
    } catch (error) {
        if (version !== screenVersion) return;
        formError(error.message);
        if (showtime) {
            try {
                const fresh = await api(`/showtimes/${showtime.id}`);
                if (version !== screenVersion) return;
                activeShowtime = fresh;
                app.querySelectorAll('input[name="seats"]').forEach(box => {
                    const taken = fresh.occupied.includes(box.value);
                    box.closest('.seat').classList.toggle('taken', taken);
                    if (taken) box.checked = false;
                    box.setAttribute('aria-label', `Ghế ${box.value}${taken ? ', đã đặt' : ''}`);
                });
                updateSeats();
            } catch { /* Giữ thông báo lỗi và dữ liệu khách để có thể thử lại. */ }
        }
    } finally {
        button.disabled = false;
        button.textContent = label;
    }
});
window.addEventListener('hashchange', render);
render();
