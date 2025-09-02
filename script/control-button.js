fetch('btncontrol.html')
    .then(response => response.text())
    .then(html => {
        document.getElementById('control-button-space').innerHTML = html;

        const buttons = document.querySelectorAll('.manu-button');
        const mainBtn = document.getElementById('mainBtn');
        const pointBtn = document.getElementById('pointBtn');
        const trackBtn = document.getElementById('trackBtn');
        const otherBtn = document.getElementById('otherBtn');
        const reportBtn = document.getElementById('reportBtn');
        const controlbutton = document.querySelector('.control-button');

        function removeActive() {
            buttons.forEach(btn => btn.classList.remove('active'));
        }

        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'index.html' || currentPage === '') {
            mainBtn.classList.add('active');
        } else if (currentPage === 'point.html') {
            pointBtn.classList.add('active');
        } else if (currentPage === 'tracking.html') {
            trackBtn.classList.add('active');
        } else if (currentPage === 'other.html') {
            otherBtn.classList.add('active');
        } else if (currentPage === 'report.html') {
            controlbutton.classList.add('active');
        }

        if (mainBtn) {
            mainBtn.addEventListener('click', function(e) {
                e.preventDefault();
                removeActive();
                mainBtn.classList.add('active');
                window.location.href = 'index.html';
            });
        }
        if (pointBtn) {
            pointBtn.addEventListener('click', function(e) {
                e.preventDefault();
                removeActive();
                pointBtn.classList.add('active');
                window.location.href = 'point.html';
            });
        }
        if (trackBtn) {
            trackBtn.addEventListener('click', function(e) {
                e.preventDefault();
                removeActive();
                trackBtn.classList.add('active');
                window.location.href = 'tracking.html';
            });
        }
        if (otherBtn) {
            otherBtn.addEventListener('click', function(e) {
                e.preventDefault();
                removeActive();
                otherBtn.classList.add('active');
                window.location.href = 'other.html';
            });
        }
        if (reportBtn) {
            reportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'report.html';
                controlbutton.classList.add('active');
            });
        }
    });