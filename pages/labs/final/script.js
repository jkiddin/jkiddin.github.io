// "obfuscated" my api key in the hopes that a crawler or scraper won't find it
// can't use github secrets since this is solely happening on the frontend
const API_KEY = atob('NGIwMTIxZjMxMzJhYTA3MjJmZDI3ZmM0YWJmMWVlOTk=');
const baseURL = 'https://ws.audioscrobbler.com/2.0/';

async function artistInfo(name) {
  try {
    const response = await fetch(`${baseURL}?method=artist.getInfo&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&format=json`);
    const data = await response.json();
    if (data.error || !data.artist) {
      return null;
    } else {
      return data.artist;
    }
  } catch (error) {
    console.error('Error fetching artist info:', error);
    return null;
  }
}

async function topAlbImg(name) {
  // Guess what! Last.fm stopped supporting artist images when you pull their info!
  // So instead, I need to make a call to retrieve their top album and display that instead.
  // so wonderful and fun.
  try {
    const response = await fetch(`${baseURL}?method=artist.getTopAlbums&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&limit=1&format=json`);
    const data = await response.json();
    
    if (data.error || !data.topalbums || !data.topalbums.album === 0) {
      return null;
    }
    
    const album = data.topalbums.album[0];
    const img = album.image.find(i => i.size === 'extralarge');
    
    if (img && img['#text']) {
      return img['#text'];
    } else {
      return null;
    }
  } catch (error) {
    console.error('error fetching top album img:', error);
    return null;
  }
}

function tagsF(rawtag) {
  const colors = ['#E63946', '#485B7C', '#00966C', '#FF6B1A', '#3742FA', '#333A47'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `<span class="badge me-2" style="background-color: ${randomColor}">${rawtag}</span>`;
}

function numLetter(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function ldSwitch() {
  const body = document.body;
  const icon = document.getElementById('ldBtn-icon');
  
  if (body.getAttribute('data-theme') === 'dark') {
    body.removeAttribute('data-theme');
    icon.classList.remove('bi-sun');
    icon.classList.add('bi-moon');
    localStorage.setItem('theme', 'light');
  } else {
    body.setAttribute('data-theme', 'dark');
    icon.classList.remove('bi-moon');
    icon.classList.add('bi-sun');
    localStorage.setItem('theme', 'dark');
  }
}

// used to keep dark/light theme consistent across homepage and /search
function consisLD() {
  const savedTheme = localStorage.getItem('theme');
  const icon = document.getElementById('ldBtn-icon');
  
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    if (icon) {
      icon.classList.remove('bi-moon');
      icon.classList.add('bi-sun');
    }
  }
}

function loadHome() {  
  const spinners = document.getElementById('spinners');
  const errHome = document.getElementById('uhoh-home');
  const topArts = document.getElementById('chartTop');

  if (!topArts) {
    return;
  }

  //error and load "handling"
  if (spinners) {
    spinners.classList.remove('d-none');
  }
  if (errHome) {
    errHome.classList.add('d-none');
  }

  fetch(`${baseURL}?method=chart.getTopArtists&api_key=${API_KEY}&limit=8&format=json`)
    .then(response => response.json())
    .then(async data => {
      if (spinners) {
        spinners.classList.add('d-none');
      }

      if (data.error) {
        if (errHome) {
          if (data.message) {
            errHome.textContent = data.message;
          } else {
            errHome.textContent = 'Failed to load top artists.';
          }
          errHome.classList.remove('d-none');
        }
        return;
      }

      const artists = data.artists.artist;
      let artistsHTML = '';
      
      artists.sort((a, b) => parseInt(b.playcount, 10) - parseInt(a.playcount, 10));
      const mappedImgs = artists.map(artist => topAlbImg(artist.name));
      const aImgs = await Promise.all(mappedImgs);
      
      artists.forEach((artist, index) => {
        const playcount = numLetter(Number(artist.playcount));
        const imgUrl = aImgs[index];
        let rankNum = '';
        let rankStyle = '';
        
        if (index === 0) {
          rankStyle = 'bg-warning text-dark';
          rankNum = '<i class="bi bi-trophy-fill"></i> #1';
        } else if (index === 1) {
          rankStyle = 'bg-secondary text-white';
          rankNum = '<i class="bi bi-award-fill"></i> #2';
        } else if (index === 2) {
          rankStyle = 'bg-secondary text-white';
          rankNum = '<i class="bi bi-award"></i> #3';
        } else {
          rankStyle = 'bg-dark text-white';
          rankNum = `#${index + 1}`;
        }
        
        let aimgHTML = '';
        if (imgUrl) {
          aimgHTML = `<img src="${imgUrl}" class="card-img-top" alt="${artist.name}">`;
        } else {
          aimgHTML = `<div class="card-img-top d-flex justify-content-center align-items-center bg-light">
                      <i class="bi bi-music-note-beamed" style="font-size: 4rem; color: #d11010;"></i>
                     </div>`;
        }
        
        artistsHTML += `
          <div class="col">
            <div class="card h-100">
              <div class="position-relative">
                ${aimgHTML}
                <div class="position-absolute top-0 end-0 m-2">
                  <span class="badge ${rankStyle} ranks">${rankNum}</span>
                </div>
              </div>
              <div class="home-card card-body">
                <h5 class="card-title">${artist.name}</h5>
                <div class="d-flex align-items-center text-muted mb-2">
                  <i class="bi bi-play-circle me-2"></i>
                  <span>${playcount} plays</span>
                </div>
              </div>
              <div class="card-footer">
                <div class="d-grid">
                  <a href="search.html?artist=${encodeURIComponent(artist.name)}" class="btn btn-outline-primary">
                    <i class="bi bi-music-note-list me-1" style="color: #d11010"></i>View Details
                  </a>
                </div>
              </div>
            </div>
          </div>`;
      });

      if (topArts) {
        topArts.innerHTML = artistsHTML;
      }
    })
    .catch(error => {
      if (spinners) {
        spinners.classList.add('d-none');
      }
      if (errHome) {
        errHome.textContent = 'Unable to load top artists. Please check with your benevolent overlords.';
        errHome.classList.remove('d-none');
      }
      console.error('error fetching top artists:', error);
    });
}

function doSearch() {
  const main = document.querySelector('.topartContainer');
  if (main) {
    main.classList.remove('d-none');
  }
  
  const search = document.getElementById('searchBar');
  const spinner = document.getElementById('spinners2');
  const errormsg = document.getElementById('uhoh');
  const artDump = document.getElementById('artistDump');
  
  if (!search || !spinner || !errormsg || !artDump) {
    return;
  }
  
  const name = search.value.trim();

  if (name === '') {
    errormsg.textContent = 'Please enter an artist name.';
    errormsg.classList.remove('d-none');
    return;
  }

  artDump.innerHTML = '';
  errormsg.classList.add('d-none');
  spinner.classList.remove('d-none');

  Promise.all([
    artistInfo(name),
    fetch(`${baseURL}?method=artist.getTopAlbums&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&limit=4&format=json&autocorrect=1`).then(res => res.json()),
    fetch(`${baseURL}?method=artist.getTopTracks&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&limit=8&format=json&autocorrect=1`).then(res => res.json()),
    fetch(`${baseURL}?method=artist.getSimilar&artist=${encodeURIComponent(name)}&api_key=${API_KEY}&limit=4&format=json&autocorrect=1`).then(res => res.json())
  ])
  .then(async ([artistInfo, albumsData, tracksData, similarData]) => {
    spinner.classList.add('d-none');

    if (albumsData.error || tracksData.error || similarData.error) {
      let message;
      if (albumsData.message) {
        message = albumsData.message;
      } else if (tracksData.message) {
        message = tracksData.message;
      } else if (similarData.message) {
        message = similarData.message;
      } else {
        message = 'Artist not found.';
      }
      errormsg.textContent = message;
      errormsg.classList.remove('d-none');
      return;
    }

    let tagsHTML = '';
    if (artistInfo && artistInfo.tags && artistInfo.tags.tag && artistInfo.tags.tag.length > 0) {
      const tags = artistInfo.tags.tag.slice(0, 5);
      tagsHTML = tags.map(tag => tagsF(tag.name)).join('');
    } else {
      tagsHTML = '<span class="text-muted">No tags available. Congrats, they are underground.</span>';
    }
    
    let bioHTML = '';
    // assumes fault case
    let bioSummary = 'No summary. Bummer.';
    if (artistInfo && artistInfo.bio && artistInfo.bio.summary) {
      // last.fm has short "summary" info snippets
      let summary = artistInfo.bio.summary;
      //regex expressions to cleanup last.fm's bio. please do not ask how long that took me.
      //also taught myself tikz in latex and i don't know which was worse
      let cleanedSummary = summary.replace(/<a href=".*">.*<\/a>/, '');
      if (cleanedSummary && !summary.match(/^\s*<a href=".*">Read more on Last\.fm<\/a>\s*$/)) {
        bioSummary = cleanedSummary;
      }
    }
    bioHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-info-circle me-2"></i>About</h5>
          <p class="card-text">${bioSummary}</p>
        </div>
      </div>
    `;
    
    
    let listeners = '';
    if (artistInfo && artistInfo.stats && artistInfo.stats.listeners) {
      const formatListeners = numLetter(Number(artistInfo.stats.listeners));
      listeners = `
        <div class="ms-auto text-end">
          <div class="mb-1" style="color: #d11010">Listeners</div>
          <h3 class="mb-0">${formatListeners}</h3>
        </div>
      `;
    }
    
    artDump.innerHTML = `
      <div class="text-center mb-4">
        <h2 class="display-4 fw-bold mb-3">${name}</h2>
        <div class="d-inline-block mb-3">
          ${tagsHTML}
        </div>
      </div>
      ${bioHTML}
    `;

    let albumsHTML = `
      <div class="mb-5">
        <div class="d-flex align-items-center mb-4">
          <h3 class="mb-0">
            <i class="bi bi-disc me-2" style="color: #d11010"></i>Top Albums
          </h3>
          ${listeners}
        </div>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
    `;
    
    if (albumsData.topalbums && albumsData.topalbums.album) {
      albumsData.topalbums.album.forEach(album => {
        let albumImg = null;
        const img = album.image.find(i => i.size === 'extralarge');
        if (img && img['#text']) {
          albumImg = img['#text'];
        }
        
        let albumImageHtml = '';
        if (albumImg) {
          albumImageHtml = `<img src="${albumImg}" class="card-img-top" alt="${album.name}">`;
        } else {
          // when an album image can't be found, assigns a creepy little question mark
          albumImageHtml = `<div class="card-img-top d-flex justify-content-center align-items-center bg-light">
                    <i class="bi bi-question-circle text-secondary" style="font-size: 5rem;"></i>
                   </div>`;
        }
        
        let playsText = '';
        if (album.playcount) {
          playsText = numLetter(Number(album.playcount)) + ' plays';
        }
        
        albumsHTML += `
          <div class="col">
            <div class="card h-100">
              ${albumImageHtml}
              <div class="card-body">
                <h6 class="card-title text-truncate" title="${album.name}">${album.name}</h6>
                <p class="card-text small text-muted mb-0">
                  <i class="bi bi-collection-play-fill me-1"></i>${playsText}
                </p>
              </div>
            </div>
          </div>`;
      });
    } else {
      albumsHTML += '<div class="col-12"><p>No albums found for this artist. Yikes.</p></div>';
    }
    albumsHTML += '</div></div>';

    let tracksHTML = `
      <div class="mb-5">
        <h3 class="mb-4">
          <i class="bi bi-music-note-list me-2" style="color: #d11010"></i>Top Tracks
        </h3>
    `;
    
    if (tracksData.toptracks && tracksData.toptracks.track) {
      // need flush to render the data in a card
      tracksHTML += '<div class="card"><ul class="list-group list-group-flush">';
      tracksData.toptracks.track.forEach((track, index) => {
        const listeners = numLetter(Number(track.listeners));
        tracksHTML += `
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="badge rounded-pill bg-danger me-3">#${index + 1}</span>
                <span>${track.name}</span>
              </div>
              <span class="badge bg-danger rounded-pill">
                <i class="bi bi-headphones text-white me-1"></i>${listeners}
              </span>
            </div>
          </li>`;
      });
      tracksHTML += '</ul></div>';
    } else {
      tracksHTML += '<p>No tracks found for this artist.</p>';
    }
    tracksHTML += '</div>';

    let similarHTML = `
      <div>
        <h3 class="mb-4">
          <i class="bi bi-people me-2" style="color: #d11010"></i>Similar Artists
        </h3>
        <div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
    `;
    
    if (similarData.similarartists && similarData.similarartists.artist && similarData.similarartists.artist.length > 0) {
      const simArts = similarData.similarartists.artist;
      const simArtsProm = simArts.map(artist => topAlbImg(artist.name));
      const simaImgs = await Promise.all(simArtsProm);
      
      simArts.forEach((similar, index) => {
        const simImg = simaImgs[index];
        const perc = Math.round(similar.match * 100);
        
        let simaHTML = '';
        if (simImg) {
          simaHTML = `<img src="${simImg}" class="card-img-top" alt="${similar.name}">`;
        } else {
          simaHTML = `<div class="card-img-top d-flex justify-content-center align-items-center bg-light">
                    <i class="bi bi-music-note-beamed text-secondary" style="font-size: 4rem;"></i>
                   </div>`;
        }
        
        similarHTML += `
          <div class="col">
            <div class="card h-100">
              ${simaHTML}
              <div class="card-body">
                <h6 class="card-title text-truncate" title="${similar.name}">${similar.name}</h6>
                <div class="mb-2">
                  <div class="d-flex justify-content-between mb-1">
                    <span class="small text-muted">Match Score:</span>
                    <span class="small text-muted">${perc}%</span>
                  </div>
                  <div class="progress" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" style="width: ${perc}%;" 
                        aria-valuenow="${perc}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
              </div>
              <div class="card-footer">
                <div class="d-grid">
                  <a href="search.html?artist=${encodeURIComponent(similar.name)}" class="btn btn-outline-primary">
                    <i class="bi bi-music-note-list me-1"></i>View Artist
                  </a>
                </div>
              </div>
            </div>
          </div>`;
      });
    } else {
      similarHTML += '<div class="col-12"><p>No similar artists found.</p></div>';
    }
    similarHTML += '</div></div>';

    artDump.innerHTML += albumsHTML + tracksHTML + similarHTML;
  })
  .catch(error => {
    spinner.classList.add('d-none');
    errormsg.textContent = 'Failed to retrieve data.';
    errormsg.classList.remove('d-none');
    console.error('error fetching artist data:', error);
  });
}

// automatically searches if redirected from a button press (or query)
function autosearch() {
  //check if on search
  if (!document.getElementById('search')) {
    return;
  }

  const search = document.getElementById('searchBar');
  const params = new URLSearchParams(window.location.search);
  const artist = params.get('artist');
  
  if (artist && search) {
    search.value = artist;
    doSearch();
  }
}

function initPage() {
  consisLD();
  loadHome();
  autosearch();
}