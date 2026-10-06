/* &FRIENDS — music-player.js
   Lets visitors play each Featured Artist right on the music page — no API key or backend needed.
   It uses the free embedded players from Spotify / YouTube, or a plain audio file.

   HOW TO ADD MUSIC: fill in ARTISTS below. For each artist paste ONE of:
     spotify : any Spotify link  (artist, album, track or playlist) e.g. 'https://open.spotify.com/artist/xxxxxxxx'
     youtube : any YouTube link  (video or playlist)
     audio   : a direct .mp3 link (e.g. a Firebase Storage download URL)
   With nothing filled in, the button opens a "Listen on Spotify" search for that artist. */
(function () {
    'use strict';
    var ARTISTS = {
        'bongeziwe mabandla': { spotify: 'https://open.spotify.com/artist/5upKpIk1pv0hh0u2gwblwy?si=Os1uEXtsT06jtywEafWv-Q', youtube: '', audio: '' },
        'vuyo vive': { spotify: 'https://open.spotify.com/artist/0izMndRrjUpSI7mig8yIBj?si=PFxtR5kzRRaCtfzDaGfcvQ', youtube: '', audio: '' },
        'marcus harvey': { spotify: 'https://open.spotify.com/artist/5MTx8G4UpDgIhvl1eRxJq6?si=eysnf5wYQiW7Q1G5MfNT8A', youtube: '', audio: '' },
        'a - reece': { spotify: 'https://open.spotify.com/artist/5TirRF3azWV5OpyufcDCFP?si=hi_OQRXpR963GR6PGlf8eg ', youtube: '', audio: '' },
        'loatinover pounds': { spotify: 'https://open.spotify.com/artist/5umZ6PgOsDmgJQFcYmAiNS?si=_6miEQWMQZKUJhHZm4mMOA', youtube: '', audio: '' },
        'lia butler': { spotify: 'https://open.spotify.com/artist/5OKv9ZYvL5vY2slfYqRYYG?si=0odtY078RVG5Ye9gTtWLuw', youtube: '', audio: '' },
        'zoe modiga': { spotify: 'https://open.spotify.com/artist/6vfxDPW9Lc9tAMVy0oeqiB?si=FwJEt3VERzqd4TS47rT_8w', youtube: '', audio: '' },
        'fiji mageba': { spotify: 'https://open.spotify.com/artist/6G2TipihRm2uODVF7RXQIn?si=4zGAunobRnu3bf2ybCFT6w', youtube: '', audio: '' }
    };

    /* The player lives for the whole visit. When pages are swapped (site-persist.js) this file runs again:
       it only re-attaches the play buttons to the new page and leaves the playing song alone. */
    if (window.__afMusic) { window.__afMusic.wire(); return; }

    function norm(s) { return (s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
    function spotifyEmbed(v) {
        var m = String(v).match(/(artist|album|track|playlist|show|episode)[\/:]([A-Za-z0-9]+)/);
        return m ? 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?theme=0' : '';
    }
    function youtubeEmbed(v) {
        var s = String(v), l = s.match(/[?&]list=([\w-]+)/), id = s.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
        if (id) return 'https://www.youtube-nocookie.com/embed/' + id[1] + '?autoplay=1' + (l ? '&list=' + l[1] : '');
        return l ? 'https://www.youtube-nocookie.com/embed/videoseries?autoplay=1&list=' + l[1] : '';
    }

    var bar = document.createElement('div');
    bar.className = 'mp-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Music player');
    bar.innerHTML = '<div class="mp-inner"><img class="mp-art" alt=""><div class="mp-meta"><div class="mp-name"></div>' +
        '<div class="mp-sub"><span class="mp-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>Now playing</span></div></div>' +
        '<button class="mp-ctl mp-min" aria-label="Show or hide the player" aria-expanded="true" title="Show / hide player"><span>▾</span></button>' +
        '<button class="mp-ctl mp-close" aria-label="Stop music and close" title="Stop music"><span>✕</span></button></div>' +
        '<div class="mp-stage"></div>';
    document.body.appendChild(bar);
    var stage = bar.querySelector('.mp-stage'), nameEl = bar.querySelector('.mp-name'), artEl = bar.querySelector('.mp-art');
    var currentName = null, currentBtn = null;

    function setBtn(btn, on) {
        if (!btn) return;
        btn.classList.toggle('is-on', on); btn.textContent = on ? '❚❚' : '▶';
        btn.setAttribute('aria-label', (on ? 'Stop ' : 'Play ') + btn.getAttribute('data-name'));
    }
    function closePlayer() {
        stage.innerHTML = ''; bar.classList.remove('open', 'min'); document.body.classList.remove('mp-open');
        setBtn(currentBtn, false); currentName = null; currentBtn = null;
        if (window.AFNav) window.AFNav.disable();                         // links go back to normal page loads
    }
    var minBtn = bar.querySelector('.mp-min');
    function setMin(m) { bar.classList.toggle('min', m); minBtn.setAttribute('aria-expanded', String(!m)); }
    minBtn.addEventListener('click', function () { setMin(!bar.classList.contains('min')); });
    document.addEventListener('af:pagechange', function () { if (currentName) setMin(true); });   // tuck away after moving to another page
    bar.querySelector('.mp-close').addEventListener('click', closePlayer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && currentName) closePlayer(); });

    function open(img, btn, name) {
        var cfg = ARTISTS[norm(name)] || {};
        if (currentName === name) { closePlayer(); return; }              // second click on the same artist = stop
        stage.innerHTML = ''; setBtn(currentBtn, false);                  // switching artist replaces the song
        var sp = cfg.spotify && spotifyEmbed(cfg.spotify), yt = !sp && cfg.youtube && youtubeEmbed(cfg.youtube);
        if (sp || yt) {
            var f = document.createElement('iframe');
            f.src = sp || yt; f.title = name + ' player';
            f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            stage.appendChild(f);
        } else if (cfg.audio) {
            var a = document.createElement('audio'); a.controls = true; a.autoplay = true; a.src = cfg.audio; stage.appendChild(a);
        } else {
            var n = document.createElement('div'); n.className = 'mp-note';
            n.textContent = 'Music for ' + name + ' is coming soon to the site. ';
            n.appendChild(document.createElement('br'));
            var l = document.createElement('a'); l.target = '_blank'; l.rel = 'noopener';
            l.href = 'https://open.spotify.com/search/' + encodeURIComponent(name); l.textContent = 'Listen on Spotify ↗';
            n.appendChild(l); stage.appendChild(n);
        }
        artEl.src = img ? img.src : ''; nameEl.textContent = name;
        currentName = name; currentBtn = btn; setBtn(btn, true);
        setMin(false); bar.classList.add('open');
        if (window.AFNav) window.AFNav.enable();                          // keep the song alive while browsing
    }

    function wire() {
        var cards = document.querySelectorAll('#artists .artists-grid > div');
        Array.prototype.forEach.call(cards, function (card) {
            var h = card.querySelector('h3'), frame = card.querySelector('.reveal-left'); if (!h || !frame || frame.querySelector('.mp-btn')) return;
            var name = h.textContent.replace(/\s+/g, ' ').trim(), img = card.querySelector('img');
            var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mp-btn'; btn.textContent = '▶';
            btn.setAttribute('data-name', name); btn.setAttribute('aria-label', 'Play ' + name);
            frame.appendChild(btn);
            if (name === currentName) { currentBtn = btn; setBtn(btn, true); }   // song from the last page is still playing
            btn.addEventListener('click', function (e) { e.stopPropagation(); open(img, btn, name); });
            frame.addEventListener('click', function (e) { if (e.target !== btn) open(img, btn, name); });
        });
    }
    window.__afMusic = { wire: wire };
    wire();
})();
