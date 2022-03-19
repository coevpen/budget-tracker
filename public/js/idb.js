// to hold db connection
let db;

// establish connection to IndexedDB database 'budget'
const request = indexedDB.open('budget', 1);

// emits if database version changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // creates object store called 'new_budget'
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    db = event.target.result;

    // check if app is online, if yes, run uploadData() 
    if(navigator.onLine){
        uploadData();
    }
};

// on error
request.onerror = function(event){
    console.log(event.target.errorCode);
};

// executed if attempt to save new budget without an internet connection
function saveRecord(record){
    // open new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store for 'new_budget'
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to store
    budgetObjectStore.add(record);
}

function uploadData() {
    const transaction = db.transaction(['new_budget'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_budget');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon successful .getAll() execution
    getAll.onsuccess = function() {
        // if data in store, send to api server
        if(getAll.result.length > 0){
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_budget'], 'readwrite');
                const budgetObjectStore = transaction.objectStore('new_budget');
                //clear all itmes in store
                budgetObjectStore.clear();

                alert('All data has been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

window.addEventListener('online', uploadData);