const USER = "thukhakyawe";
const API = "https://api.github.com";

const fmt = (n) =>
    new Intl.NumberFormat().format(n || 0);

const esc = (s) =>
    String(s || "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);

async function getJSON(url) {
    const response = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json"
        },
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(response.status);
    }

    return response.json();
}

async function loadGitHub() {
    const status = document.getElementById("github-status");
    const reposEl = document.getElementById("github-repos");
    const langsEl = document.getElementById("github-languages");

    try {
        const [profile, repos] = await Promise.all([
            getJSON(
                `${API}/users/${USER}?_=${Date.now()}`
            ),

            getJSON(
                `${API}/users/${USER}/repos?per_page=100&sort=pushed&direction=desc&_=${Date.now()}`
            )
        ]);

        // Only your own active repositories.
        // Forks and archived repositories are excluded.
        const owned = repos.filter(
            (repo) => !repo.fork && !repo.archived
        );

        // GitHub API returns these in latest-pushed order.
        const latest = owned.slice(0, 5);

        // -----------------------------
        // Statistics
        // -----------------------------

        document.getElementById("gh-repos").textContent =
            fmt(profile.public_repos);

        document.getElementById("gh-followers").textContent =
            fmt(profile.followers);

        document.getElementById("gh-stars").textContent =
            fmt(
                owned.reduce(
                    (total, repo) =>
                        total + repo.stargazers_count,
                    0
                )
            );

        document.getElementById("gh-forks").textContent =
            fmt(
                owned.reduce(
                    (total, repo) =>
                        total + repo.forks_count,
                    0
                )
            );

        status.textContent =
            "Live public repository data";

        document.getElementById(
            "github-updated"
        ).textContent = "Live from GitHub";

        // -----------------------------
        // Latest repositories
        // -----------------------------

        reposEl.innerHTML = latest.length
            ? latest.map((repo) => `
                <a
                    class="repo"
                    href="${repo.html_url}"
                    target="_blank"
                    rel="noopener"
                >
                    <div>

                        <div class="repo-name">
                            ${esc(repo.name)}
                        </div>

                        <div class="repo-desc">
                            ${esc(
                                repo.description ||
                                "No repository description yet."
                            )}
                        </div>

                        <div class="repo-meta">

                            ${
                                repo.language
                                    ? `
                                        <span>
                                            ● ${esc(repo.language)}
                                        </span>
                                    `
                                    : ""
                            }

                            <span>
                                ★ ${fmt(repo.stargazers_count)}
                            </span>

                            <span>
                                ⑂ ${fmt(repo.forks_count)}
                            </span>

                            <span>
                                ${esc(repo.visibility)}
                            </span>

                        </div>

                    </div>

                    <div class="repo-arrow">
                        ↗
                    </div>

                </a>
            `).join("")
            : `
                <div class="github-error">
                    <strong>
                        No public repositories found.
                    </strong>

                    Publish projects and they will appear
                    here automatically.
                </div>
            `;

        // -----------------------------
        // Languages
        // -----------------------------

        const languageCounts = {};

        owned.forEach((repo) => {
            if (repo.language) {
                languageCounts[repo.language] =
                    (languageCounts[repo.language] || 0) + 1;
            }
        });

        const languageRows = Object.entries(languageCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const languageTotal =
            languageRows.reduce(
                (total, [, count]) => total + count,
                0
            ) || 1;

        langsEl.innerHTML = languageRows.length
            ? languageRows.map(([name, count]) => {

                const percentage = Math.max(
                    5,
                    Math.round(
                        (count / languageTotal) * 100
                    )
                );

                return `
                    <div class="lang">

                        <div class="lang-line">
                            <span>
                                ${esc(name)}
                            </span>

                            <span>
                                ${percentage}%
                            </span>
                        </div>

                        <div class="lang-bar">
                            <i
                                style="width:${percentage}%"
                            ></i>
                        </div>

                    </div>
                `;

            }).join("")
            : `
                <div class="github-error">
                    Language metadata will appear once
                    public repositories contain source code.
                </div>
            `;

    } catch (error) {

        console.error(
            "GitHub API error:",
            error
        );

        status.textContent =
            "GitHub data temporarily unavailable";

        reposEl.innerHTML = `
            <div class="github-error">

                <strong>
                    GitHub API could not be reached.
                </strong>

                The portfolio remains usable.

                <a
                    href="https://github.com/${USER}"
                    target="_blank"
                    rel="noopener"
                    style="color:var(--green)"
                >
                    Open GitHub directly ↗
                </a>

            </div>
        `;

        langsEl.innerHTML = `
            <div class="github-error">
                Live language data is unavailable right now.
            </div>
        `;

        document.getElementById(
            "github-updated"
        ).textContent = "GitHub profile";
    }
}

loadGitHub();