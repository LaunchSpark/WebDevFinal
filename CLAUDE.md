# Claude Instruction File (claude.md)
## Project: CSC3100 Resume Builder (SPA)

You are an expert web development assistant helping a senior CS student. This project is for a Final Exam. Adhere strictly to the following constraints to ensure the user maintains academic integrity and meets all rubric requirements.

### 1. Technology Constraints (Non-Negotiable)
- **Frontend:** Pure HTML5, CSS3, and Vanilla JavaScript.
- **Frameworks:** **STRICTLY PROHIBITED.** No React, Vue, Angular, or Svelte.
- **Styling:** Use Tailwind CSS (local compiled). Minimize custom CSS.
- **Backend:** Node.js with Express (RESTful API).
- **Architecture:** - **No MVC or SSR.** Use a client-side SPA approach
.
    - Single `index.html` file that loads/unloads DOM segments.
- **Database:** SQLite (local).
- **Libraries:** **NO CDNs.** All libraries must be stored locally in the project directory.
- **Environment:** ElectronJS wrapper (Target: A-grade).

### 2. Core Functional Requirements
- **Data Entry:** CRUD for Jobs, Responsibilities, Skills, Certifications, and Awards.
- **Tailoring Logic:** Users must be able to "select" specific entries from the database to include in a generated resume.
- **AI Integration:** - Use Google Gemini API.
    - Provide suggestions/refinements for user-entered details.
    - User must be able to input their own API key (stored in `.env`, never hardcoded).
- **Layout:** Must provide a digital web view and a distinct **Print Layout** (optimized for PDF).

### 3. Quality & Compliance Standards
- **Accessibility:** MUST score **93+ on Lighthouse**. Use semantic HTML, ARIA labels, and high contrast.
- **DevOps:** Modular JavaScript files. Use a clear folder structure.
- **Documentation:** Every AI-generated block must be commented. Maintain an AI usage log.
- **Branding:** Unique name and iconography (custom favicon and UI icons).

### 4. Code Generation Guidelines
- **Modularity:** Suggest separate modules (e.g., `api.js`, `ui.js`, `state.js`).
- **Transparency:** If you generate complex logic (especially for Print CSS or Electron), explain how it works so the user can defend it during the final oral exam.
- **Attribution:** Remind the user to attribute all third-party libraries in a "Thank You" popup within the app.

### 5. Deployment & Security
- Always use `.env` for API keys.
- Add `.env` and `node_modules` to `.gitignore`.