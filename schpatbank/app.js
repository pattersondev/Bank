/**
 * Code for Patterson Banking webpage.
 */

const routes = {
    '/login': { templateId: 'login' },
    '/dashboard': { templateId: 'dashboard', init: refresh }
};
const storageKey = 'savedAccount';

let state = Object.freeze({
    account: null
});

/**
 * Updates route appropriately
 * @returns if route is invalid you will be sent back to login
 */
function updateRoute() {
    const path = window.location.pathname;
    const route = routes[path];

    if (!route) {
        return navigate('/dashboard');
    }
    const template = document.getElementById(route.templateId);
    const view = template.content.cloneNode(true);
    const app = document.getElementById('app');

    app.innerHTML = '';
    app.appendChild(view);
    if(typeof route.init === 'function') {
        route.init();
    }
}

/**
 * Controls navigation
 * @param {*} path to follow
 */
function navigate(path) {
    window.history.pushState({}, path, path);
    updateRoute();
}
/**
 * Updates if link is clicked
 * @param {*} event that occurred
 */
function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
}

/**
 * Registers a new user account, if invalid data, error is thrown
 * @returns if account was made successfully
 */
async function register() {
    const registerForm = document.getElementById('registerForm');
    const formData = new FormData(registerForm);
    const data = Object.fromEntries(formData);
    const jsonData = JSON.stringify(data);
    const result = await createAccount(jsonData);

    if (result.error) {
        return console.log('Uh oh, error', result.error);
    }

    updateState('account', result);
    navigate('/dashboard');
    console.log('Account created successfully', result);
}

//Creates account, if request is invalid error is thrown
async function createAccount(account) {
    try {
        const response = await fetch('//localhost:5000/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            body: account
        });
        return await response.json();
    } catch(error) {
        return { error: error.message || 'Unknown error' };
    }
}

/**
 * Attemps login, if user is invalid error is thrown
 * @returns if account is created successfully
 */
async function login() {
    const loginForm = document.getElementById('loginForm');
    const user = loginForm.user.value;
    const data = await getAccount(user);

    if (data.error) {
        return updateElement('loginError', data.error);
    }

    updateState('account', data);
    navigate('/dashboard');
}

function logout() {
    updateState('account', null);
    navigate('/login');
}

/**
 * Fetches the user's account, if account does not exist, error is thrown
 * @param {*} user account to fetch
 * @returns if account is found or not
 */
async function getAccount(user) {
    try{
        const response = await fetch('//localhost:5000/api/accounts' + encodeURIComponent(user));
        return await response.json();
    } catch (error) {
        return {error: error.message || 'Unknown error'};
    }
}

/**
 * Updates account data
 * @returns if failure you are sent back to login page.
 */
async function updateAccountDate() {
    const account = state.account;
    if (!account) {
        return logout();
    }

    const data = await getAccount(account.user);
    if (data.error) {
        return logout();
    }

    updateState('account', data)
}

/**
 * Updates element requested
 * @param {*} id of element to update
 * @param {*} textOrNode to append to element
 */
function updateElement(id, textOrNode) {
    const element = document.getElementById(id);

    element.textContent = '';
    element.append(textOrNode);
}

/**
 * Updates the dashboard if the account is valid.
 * @returns updated dashboard unless account is invalid, in that case you are sent back to the login page
 */
function updateDashboard() {
    const account = state.account;
    const transRows = document.createDocumentFragment();

    if (!account) {
        return logout();
    }

    updateElement('description', account.description);
    updateElement('balance'. account.balance.toFixed(2));
    updateElement('currency', account.currecy);

    for (const transaction of account.transactions) {
        const transRow = createTransactionRow(transaction);
        transRows.appendChild(transRow); 
    }

    updateElement('transactions', transRows);
}

/**
 * Builds a transaction row.
 * @param {*} transaction to add
 */
function createTransactionRow(transaction) {
    const template = document.getElementById('transaction');
    const transRow = template.content.cloneNode(true);
    const tr = transRow.querySelector('tr');

    tr.children[0].textContent = transaction.date;
    tr.children[1].textContent = transaction.object;
    tr.children[2].textContent = transaction.amount.toFixed(2);

}

function updateState(property, newData) {
    state = Object.freeze({
        ...state,
        [property]: newData
    });
}

/**
 * Checks if user is logged in and updates data appropriately.
 */
async function refresh() {
    await updateAccountDate();
    updateDashboard();
}

/**
 * Initializes the website, and persists stored data locally.
 */
function init() {
    const savedAccount = localStorage.getItem(storageKey);

    if (savedAccount) {
        updateState('account', JSON.parse(savedAccount));
    }

    window.onpopstate = () => updateRoute();
    updateRoute();
}

init();