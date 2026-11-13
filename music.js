/* Background music begins only after the correct PIN is submitted. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const config = window.BIRTHDAY.music || {};
  const audio = $("backgroundMusic");
  const player = $("musicPlayer");
  const defaultSource = config.src || "assets/audio/untukmu.mp3";
  const defaultTitle = config.title || "Untukmu · instrumental";
  let unlocked = false;
  let wantsPlayback = false;
  let requestId = 0;
  let blobURL = null;
  const initialVolume = Number(config.volume ?? 0.3);
  audio.volume = Math.max(0, Math.min(1, Number.isFinite(initialVolume) ? initialVolume : 0.3));
  audio.loop = config.loop !== false;
  audio.src = defaultSource;
  $("musicTitle").textContent = defaultTitle;

  function status(text) { $("musicState").textContent = text; }
  function updateButton(playing) {
    $("musicToggle").setAttribute("aria-label", playing ? "Jeda musik" : "Putar musik");
    $("musicToggle").setAttribute("aria-pressed", String(playing));
    $("musicPlayIcon").toggleAttribute("hidden", playing);
    $("musicPauseIcon").toggleAttribute("hidden", !playing);
  }
  function updateVolume() {
    const percent = Math.round(audio.volume * 100);
    $("musicVolume").value = String(percent);
    $("musicVolumeValue").value = `${percent}%`;
    $("musicVolume").setAttribute("aria-valuetext", `${percent} persen`);
  }
  function pause() {
    wantsPlayback = false;
    requestId += 1;
    audio.pause();
    updateButton(false);
    status("Dijeda");
  }
  async function play() {
    if (!unlocked) return;
    const thisRequest = ++requestId;
    wantsPlayback = true;
    status("Memuat musik…");
    try {
      await audio.play();
      if (thisRequest !== requestId || !wantsPlayback) return;
      updateButton(true);
      status("Sedang diputar");
    } catch (error) {
      // A newer pause/source selection owns the state of the player now.
      if (thisRequest !== requestId) return;
      wantsPlayback = false;
      updateButton(false);
      status(error.name === "NotAllowedError" ? "Ketuk putar untuk mulai" : "Lagu tidak dapat diputar");
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
        $("musicNote").textContent = "Pilih berkas MP3 lain atau kembali ke lagu bawaan.";
      }
    }
  }
  function changeSource(source, title, isLocalFile) {
    pause();
    audio.src = source;
    audio.load();
    $("musicTitle").textContent = title;
    $("resetMusic").hidden = !isLocalFile;
    $("musicNote").textContent = isLocalFile ? "Pilihan ini berlaku sampai halaman dimuat ulang." : "MP3 dari perangkat Anda.";
    void play();
  }
  $("musicToggle").addEventListener("click", () => {
    if (wantsPlayback || !audio.paused) pause(); else void play();
  });
  $("musicVolume").addEventListener("input", event => {
    audio.volume = Number(event.target.value) / 100;
    updateVolume();
  });
  audio.addEventListener("volumechange", updateVolume);
  audio.addEventListener("playing", () => {
    if (!wantsPlayback) { audio.pause(); return; }
    updateButton(true);
    status("Sedang diputar");
  });
  audio.addEventListener("pause", () => {
    if (!audio.paused) return;
    wantsPlayback = false;
    updateButton(false);
    status(audio.ended ? "Selesai diputar" : "Dijeda");
  });
  audio.addEventListener("ended", () => { wantsPlayback = false; updateButton(false); status("Selesai diputar"); });
  audio.addEventListener("error", () => {
    if (!unlocked) return;
    wantsPlayback = false;
    updateButton(false);
    status("Lagu tidak dapat diputar");
    $("musicNote").textContent = "Periksa alamat lagu di config.js atau pilih MP3 lain.";
  });
  $("musicSettings").addEventListener("click", () => {
    const open = $("musicPanel").hidden;
    $("musicPanel").hidden = !open;
    $("musicSettings").setAttribute("aria-expanded", String(open));
  });
  player.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    $("musicPanel").hidden = true;
    $("musicSettings").setAttribute("aria-expanded", "false");
    $("musicSettings").focus();
  });
  $("chooseMusic").addEventListener("click", () => $("musicFile").click());
  $("musicFile").addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name)) {
      $("musicNote").textContent = "Pilih berkas audio, misalnya MP3, M4A, WAV, atau OGG.";
      event.target.value = "";
      return;
    }
    const previousURL = blobURL;
    blobURL = URL.createObjectURL(file);
    changeSource(blobURL, file.name.replace(/\.[^.]+$/, ""), true);
    if (previousURL) URL.revokeObjectURL(previousURL);
    event.target.value = "";
  });
  $("resetMusic").addEventListener("click", () => {
    const previousURL = blobURL;
    blobURL = null;
    changeSource(defaultSource, defaultTitle, false);
    if (previousURL) URL.revokeObjectURL(previousURL);
  });
  window.addEventListener("pagehide", () => { pause(); });
  updateVolume();
  window.birthdayMusic = {
    unlock() {
      if (unlocked) return;
      unlocked = true;
      player.hidden = false;
      document.body.classList.add("has-music");
      if (config.autoplay !== false) void play();
    }
  };
})();
