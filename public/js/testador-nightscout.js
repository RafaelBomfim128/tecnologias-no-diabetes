document.addEventListener("DOMContentLoaded", () => {
    const btnTestNightscout = document.querySelector('#testNightscout');
    if (btnTestNightscout) {
        btnTestNightscout.addEventListener('click', function () {
            const url = document.querySelector('#urlInput')
            const urlValue = url.value.trim();

            const apiSecret = document.querySelector('#apiSecretInput')
            const apiSecretValue = apiSecret.value.trim();

            if (!urlValue) {
                url.classList.add('error-input');
                url.focus();
                document.getElementById('urlError').classList.remove('hidden');
                return;
            } else {
                url.classList.remove('error-input');
                document.getElementById('urlError').classList.add('hidden');
            }
            if (!apiSecretValue) {
                apiSecret.classList.add('error-input');
                apiSecret.focus();
                document.getElementById('apiSecretError').classList.remove('hidden');
                return;
            } else {
                apiSecret.classList.remove('error-input');
                document.getElementById('apiSecretError').classList.add('hidden');
            }
            setTimeout(showElements, 100);


        });
    }
})

function showElements() {
    const statusList = document.querySelector('.status-list');
    if (statusList.classList.contains('hidden')) {
        statusList.classList.remove('hidden');
        document.getElementById('resume').classList.remove('hidden');
        document.querySelector('h2.hidden').classList.remove('hidden');
        document.querySelectorAll('button.hidden').forEach(btn => btn.classList.remove('hidden'));
    }
    const y = statusList.getBoundingClientRect().top + window.pageYOffset - 60;
    window.scrollTo({ top: y, behavior: 'smooth' });
}

function checkUrlNightscout() {

}