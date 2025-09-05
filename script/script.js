const playNotificationSound = async (soundUrl) => {
    const audio = new Audio(soundUrl);
    audio.volume = 0.5; // ปรับระดับเสียง (0.0 ถึง 1.0)
    try {
        await audio.play();
    } catch (error) {
        console.error('Failed to play sound:', error);
    }
};

const toastAlert = (type, text, delay = 3000) => {
    const toast = document.createElement('div');
    toast.className = 'toast toast-onload align-items-center border-0 rounded-4 shadow-lg fade show';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('data-bs-delay', delay);

    let textStatus = "";
    let iconStatus = "";
    let bgColorClass = "";
    let soundUrl = "";

    switch (type) {
        case 1:
            textStatus = "<i class='fa-duotone fa-thumbs-up'></i> สำเร็จ";
            iconStatus = "https://cdn.lordicon.com/oqdmuxru.json";
            bgColorClass = "gradient-green";
            soundUrl = "https://notificationsounds.com/storage/sounds/file-sounds-767-arpeggio.mp3";
            break;
        case 0:
            textStatus = "<i class='fa-duotone fa-triangle-exclamation'></i> ผิดพลาด";
            iconStatus = "https://cdn.lordicon.com/vihyezfv.json";
            bgColorClass = "gradient-red";
            soundUrl = "https://notificationsounds.com/storage/sounds/file-sounds-1215-strong-minded.mp3";
            break;
        case 2:
            textStatus = "<i class='fa-duotone fa-cloud-question'></i> รายละเอียด";
            iconStatus = "https://cdn.lordicon.com/axteoudt.json";
            bgColorClass = "gradient-violet";
            soundUrl = "https://notificationsounds.com/storage/sounds/file-sounds-1219-magic.mp3";
            break;
        case 3:
            textStatus = "<i class='fa-duotone fa-bell'></i> แจ้งเตือน";
            iconStatus = "https://cdn.lordicon.com/vspbqszr.json";
            bgColorClass = "gradient-yellow";
            soundUrl = "https://notificationsounds.com/storage/sounds/file-sounds-1147-that-was-quick.mp3";
            break;
        default:
            textStatus = "<i class='fa-duotone fa-bullhorn'></i> ประกาศ";
            iconStatus = "https://cdn.lordicon.com/lecprnjb.json";
            bgColorClass = "gradient-blue";
            soundUrl = "https://notificationsounds.com/storage/sounds/file-sounds-1225-conclusive.mp3";
    }

    toast.classList.add(bgColorClass);

    toast.innerHTML = `
        <div class="toast-body d-flex align-items-center">
            <lord-icon
                src="${iconStatus}"
                trigger="loop"
                state="morph-check-in-1"
                colors="primary:#ffffff"
                style="width:40px;height:40px;margin-right:10px;">
            </lord-icon>
            <div>
                <h5 class="text-white mb-1">${textStatus}</h5>
                <h6 class="text-white mb-0">${text}</h6>
            </div>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    document.getElementById('toast-container').appendChild(toast);

    const bootstrapToast = new bootstrap.Toast(toast);
    bootstrapToast.show();

    playNotificationSound(soundUrl);

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
};

const showLoader = (delay = 3000) => {
    document.getElementById('loader-container').style.display = '';
    document.querySelector('.main-container').style.display = 'none';
    setTimeout(() => {
        document.getElementById('loader-container').style.display = 'none';
        document.querySelector('.main-container').style.display = '';
    }, delay);

}

const getPositionbtn = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        toastAlert(0, "Geolocation is not supported by this browser.");
    }
};

const showPosition = (position) => {
    const latitude = position.coords.latitude.toFixed(9);
    const longitude = position.coords.longitude.toFixed(9);
    document.getElementById("issuePosition").value = `${latitude}, ${longitude}`;
    toastAlert(1, "พิกัดถูกระบุเรียบร้อยแล้ว");
};

const showError = (error) => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            toastAlert(0, "User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            toastAlert(0, "Location information is unavailable.");
            break;
        case error.TIMEOUT:
            toastAlert(0, "The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            toastAlert(0, "An unknown error occurred.");
            break;
    }
};