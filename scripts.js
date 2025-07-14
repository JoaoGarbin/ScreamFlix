document.addEventListener('DOMContentLoaded', () => {

    const App = {
        db: null,
        userDb: null,

        init() {
            try {
                this.db = new PouchDB('screamflix_movies');
                this.userDb = new PouchDB('screamflix_users');
            } catch (e) {
                console.error("PouchDB não foi encontrado. Certifique-se de que a biblioteca está carregada na página.");
                return;
            }
            this.Auth.init();
            this.Admin.init();
            this.Catalog.init();
            this.Details.init();
        },

        Auth: {
            init() {
                const loginForm = document.getElementById("login-form");
                if (!loginForm) return;

                this.bindTabs();
                this.bindForms();
            },

            bindTabs() {
                const loginTab = document.getElementById("login-tab");
                const registerTab = document.getElementById("register-tab");
                const loginForm = document.getElementById("login-form");
                const registerForm = document.getElementById("register-form");

                loginTab.addEventListener("click", () => {
                    loginTab.className = "py-2 px-4 border-b-2 border-primary-red text-white w-1/2";
                    registerTab.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 w-1/2";
                    loginForm.classList.remove("hidden");
                    registerForm.classList.add("hidden");
                });

                registerTab.addEventListener("click", () => {
                    registerTab.className = "py-2 px-4 border-b-2 border-primary-red text-white w-1/2";
                    loginTab.className = "py-2 px-4 border-b-2 border-transparent text-gray-400 w-1/2";
                    registerForm.classList.remove("hidden");
                    loginForm.classList.add("hidden");
                });
            },

            hashPassword(password) {
                return password.split('').reverse().join('');
            },

            async handleLogin(event) {
                event.preventDefault();
                const email = document.getElementById("login-email").value;
                const password = document.getElementById("login-password").value;
                const errorMessage = document.getElementById("login-error-message");

                try {
                    const user = await App.userDb.get(email);
                    if (user.password === this.hashPassword(password)) {
                        errorMessage.classList.add('hidden');
                        window.location.href = email.endsWith("@admin.com") ? "../Movie/registerMovie.html" : "../Library/catalog.html";
                    } else {
                        errorMessage.textContent = "Senha incorreta.";
                        errorMessage.classList.remove('hidden');
                    }
                } catch (err) {
                    errorMessage.textContent = "Conta não encontrada.";
                    errorMessage.classList.remove('hidden');
                }
            },

            async handleRegister(event) {
                event.preventDefault();
                const name = document.getElementById("register-name").value;
                const email = document.getElementById("register-email").value;
                const password = document.getElementById("register-password").value;
                const confirmPassword = document.getElementById("confirm-password").value;
                const errorMessage = document.getElementById("register-error-message");

                if (password !== confirmPassword) {
                    errorMessage.textContent = "As senhas não coincidem.";
                    errorMessage.classList.remove('hidden');
                    return;
                }

                const user = {
                    _id: email,
                    name: name,
                    password: this.hashPassword(password)
                };

                try {
                    await App.userDb.put(user);
                    alert("Conta criada com sucesso! Por favor, faça o login.");
                    document.getElementById("login-tab").click();
                    document.getElementById("login-email").value = email;
                    errorMessage.classList.add('hidden');
                } catch (err) {
                    if (err.name === 'conflict') {
                        errorMessage.textContent = "Este email já está em uso.";
                        errorMessage.classList.remove('hidden');
                    } else {
                        errorMessage.textContent = "Ocorreu um erro ao criar a conta.";
                        errorMessage.classList.remove('hidden');
                    }
                }
            },

            bindForms() {
                document.getElementById("login-form").addEventListener("submit", this.handleLogin.bind(this));
                document.getElementById("register-form").addEventListener("submit", this.handleRegister.bind(this));
            }
        },

        Admin: {
            init() {
                this.handleRegisterPage();
                this.handleListPage();
            },

            handleRegisterPage() {
                const form = document.getElementById("movie-register-form");
                if (!form) return;

                const params = new URLSearchParams(window.location.search);
                const movieId = params.get('id');

                if (movieId) {
                    this.loadMovieForEditing(movieId);
                }

                form.addEventListener("submit", this.onFormSubmit.bind(this));
            },

            loadMovieForEditing(movieId) {
                document.getElementById('page-title').textContent = 'Editar Filme';
                document.getElementById('page-subtitle').textContent = 'Atualize os detalhes do filme abaixo.';
                document.getElementById('submit-button').textContent = 'Atualizar Filme';

                App.db.get(movieId).then(movie => {
                    document.getElementById('movie-id').value = movie._id;
                    document.getElementById('movie-rev').value = movie._rev;
                    document.getElementById('movie-title').value = movie.title;
                    document.getElementById('movie-synopsis').value = movie.synopsis;
                    document.getElementById('movie-year').value = movie.year;
                    document.getElementById('movie-duration').value = movie.duration;
                    document.getElementById('movie-rating').value = movie.rating;
                    document.getElementById('movie-category').value = movie.category;
                    document.getElementById('movie-poster-url').value = movie.posterUrl;
                    document.getElementById('movie-bg-url').value = movie.bgUrl;
                }).catch(err => console.error('Erro ao carregar filme para edição:', err));
            },

            getMovieFromForm() {
                const movie = {
                    title: document.getElementById('movie-title').value,
                    synopsis: document.getElementById('movie-synopsis').value,
                    year: document.getElementById('movie-year').value,
                    duration: document.getElementById('movie-duration').value,
                    rating: document.getElementById('movie-rating').value,
                    category: document.getElementById('movie-category').value,
                    posterUrl: document.getElementById('movie-poster-url').value,
                    bgUrl: document.getElementById('movie-bg-url').value,
                };
                const id = document.getElementById('movie-id').value;
                const rev = document.getElementById('movie-rev').value;

                if (id && rev) {
                    movie._id = id;
                    movie._rev = rev;
                } else {
                    movie._id = new Date().toISOString();
                }
                return movie;
            },

            onFormSubmit(event) {
                event.preventDefault();
                const movie = this.getMovieFromForm();
                
                App.db.put(movie).then(() => {
                    alert(`Filme ${movie._rev ? 'atualizado' : 'cadastrado'} com sucesso!`);
                    if (movie._rev) {
                        window.location.href = './listMovie.html';
                    } else {
                        event.target.reset();
                    }
                }).catch(err => {
                    console.error('Erro ao salvar o filme:', err);
                    alert('Ocorreu um erro ao salvar o filme.');
                });
            },

            handleListPage() {
                const container = document.getElementById('movie-list-container');
                if (!container) return;

                this.renderMovieList(container);
                App.db.changes({ since: 'now', live: true }).on('change', () => this.renderMovieList(container));
                
                container.addEventListener('click', (event) => {
                    const deleteButton = event.target.closest('.delete-btn');
                    if (deleteButton) {
                        this.deleteMovie(deleteButton.dataset.id, deleteButton.dataset.rev);
                    }
                });
            },

            renderMovieList(container) {
                App.db.allDocs({ include_docs: true, descending: true }).then(result => {
                    if (result.rows.length === 0) {
                        container.innerHTML = '<p class="text-center text-gray-400">Nenhum filme cadastrado ainda.</p>';
                        return;
                    }
                    container.innerHTML = result.rows.map(item => {
                        const movie = item.doc;
                        return `
                            <div class="bg-primary-black p-4 rounded-lg flex justify-between items-center border border-secondary-black hover:bg-secondary-black transition-colors duration-300">
                                <h3 class="text-lg font-semibold text-white">${movie.title}</h3>
                                <div class="flex items-center space-x-4">
                                    <a href="./registerMovie.html?id=${movie._id}" class="text-gray-400 hover:text-primary-red transition-colors duration-300" title="Editar Filme"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg></a>
                                    <button class="text-gray-400 hover:text-red-500 transition-colors duration-300 delete-btn" title="Eliminar Filme" data-id="${movie._id}" data-rev="${movie._rev}"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>`;
                    }).join('');
                }).catch(err => console.error('Erro ao buscar os filmes:', err));
            },
            
            deleteMovie(id, rev) {
                if (confirm('Tem a certeza que quer eliminar este filme?')) {
                    App.db.remove(id, rev).catch(err => console.error('Erro ao eliminar o filme:', err));
                }
            }
        },

        Catalog: {
            init() {
                const container = document.getElementById('best-movies-container');
                if (!container) return;

                this.handleWelcomeMessage();
                this.renderCatalogPage();
                App.db.changes({ since: 'now', live: true }).on('change', this.renderCatalogPage);
            },
            
            handleWelcomeMessage() {
                const params = new URLSearchParams(window.location.search);
                const username = params.get('username');
                const welcomeMessage = document.getElementById('welcome-message');
                if (username && welcomeMessage) {
                    welcomeMessage.textContent = `Bem-vindo(a), ${username}!`;
                }
            },

            renderCatalogPage() {
                App.db.allDocs({ include_docs: true }).then(result => {
                    const containers = {
                        'Melhores Filmes de Terror': document.getElementById('best-movies-container'),
                        'Lançamentos de Terror': document.getElementById('new-releases-container'),
                        'Séries de Terror': document.getElementById('series-container'),
                    };
                    Object.values(containers).forEach(c => { if (c) c.innerHTML = ''; });

                    if (result.rows.length === 0) {
                        if (containers['Melhores Filmes de Terror']) containers['Melhores Filmes de Terror'].innerHTML = '<p class="text-gray-400 col-span-full text-center">Nenhum filme no catálogo.</p>';
                        return;
                    }

                    result.rows.forEach(item => {
                        const movie = item.doc;
                        const movieHTML = `
                            <a href="./details.html?id=${movie._id}">
                                <article class="group relative overflow-hidden rounded-md cursor-pointer">
                                    <img src="${movie.posterUrl || 'https://placehold.co/500x750/1a1a1a/FFFFFF?text=Poster'}" alt="Pôster de ${movie.title}" class="w-full h-full object-cover"/>
                                </article>
                            </a>`;
                        if (containers[movie.category]) {
                            containers[movie.category].innerHTML += movieHTML;
                        }
                    });
                }).catch(err => console.error('Erro ao carregar o catálogo:', err));
            }
        },

        Details: {
            init() {
                const container = document.getElementById('movie-details-container');
                if (!container) return;

                const params = new URLSearchParams(window.location.search);
                const movieId = params.get('id');
                if (movieId) {
                    this.renderMovieDetails(movieId, container);
                }
            },

            renderMovieDetails(movieId, container) {
                App.db.get(movieId).then(movie => {
                    container.innerHTML = `
                    <div class="min-h-screen bg-cover bg-center" style="background-image: url('${movie.bgUrl || ''}');">
                        <div class="h-full min-h-screen bg-gradient-to-t from-primary-black via-primary-black/80 to-transparent">
                            <main class="container mx-auto px-4 pt-24 pb-10 flex items-end h-full min-h-screen">
                                <div>
                                    <a href="./catalog.html" class="mb-4 inline-flex items-center px-3 py-1 bg-secondary-black/50 rounded-md hover:bg-secondary-black transition-colors">
                                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                                        Voltar ao Catálogo
                                    </a>
                                    <h1 class="text-4xl md:text-6xl font-bold text-white mb-4">${movie.title}</h1>
                                    <div class="flex items-center space-x-4 mb-4 text-gray-400">
                                        <span>${movie.year || ''}</span>
                                        <span>•</span>
                                        <span>${movie.duration ? movie.duration + 'm' : ''}</span>
                                        <span>•</span>
                                        <span class="border border-gray-400 px-2 rounded">${movie.rating || 'N/A'}</span>
                                    </div>
                                    <p class="text-lg max-w-3xl mb-6">${movie.synopsis || ''}</p>
                                    <div class="flex space-x-4">
                                        <button class="bg-primary-red hover:brightness-90 text-white font-bold py-3 px-8 rounded-md transition-all duration-300">Assistir Filme</button>
                                        <button class="bg-black/50 border border-white text-white font-bold py-3 px-8 rounded-md hover:bg-white hover:text-black transition-colors duration-300">Ver Trailer</button>
                                    </div>
                                </div>
                            </main>
                        </div>
                    </div>`;
                }).catch(err => {
                    console.error("Erro ao buscar detalhes do filme:", err);
                    container.innerHTML = '<p class="text-center text-red-500 pt-24">Não foi possível carregar os detalhes deste filme.</p>';
                });
            }
        }
    };

    App.init();
});
