import { memoize } from "../utils";

export function ensureStorageSchema(gen: number) {
    console.log("Storage schema generation:", localStorage.gen)
    localStorage.gen ||= gen;
    if (localStorage.gen < gen) {
        console.log(`Clearing schema, latest generation: ${gen}`)
        localStorage.clear();
        sessionStorage.clear();
        localStorage.gen = gen;
    }
}

function __getTabState(key: string, _tabID: number): string {
    return localStorage[`tabState:${_tabID}:${key}`] || "";
}

export function getTabState(key: string, _tabID: number = tabManager.loadTabID()): string {
    return __getTabState(key, _tabID);
}

export function deleteTabState(key: string, _tabID: number = tabID) {
    delete localStorage[`tabState:${_tabID}:${key}`];
}

export function setTabState(key: string, value: string, _tabID: number = tabID) {
    localStorage[`tabState:${_tabID}:${key}`] = value;
}

class TabManager {
    constructor() {

    }

    @memoize
    isTabDuplicate() {
        // return window.performance.getEntriesByType("navigation")[0].type == 'back_forward'
        addEventListener('beforeunload', function () {
            delete sessionStorage.__lock;
        });

        let dup = false;
        if (sessionStorage.__lock) {
            console.warn("sessionStorage.__lock set, likely a duplicate tab")
            dup = true;
        }
        sessionStorage.__lock = 1;
        return dup
    }


    selectTabID() {
        for (let i = 1; i <= 1000; i++) {
            if (getTabState("lock", i) == "") {
                return i;
            }
        }
    }

    @memoize
    loadTabID(): number {
        let _tabID: number = -1;
        let dup = this.isTabDuplicate()
        console.warn("sessionStorage.tabID", sessionStorage.tabID, "isTabDuplicate", dup, "getTabState", __getTabState("lock", sessionStorage.tabID))
        // Duplicated Tabs will have the same tabID and peerID as their parent Tab; we must force reset those values
        if (!sessionStorage.tabID || dup || getTabState("lock", sessionStorage.tabID) != "") {
            console.warn("tab is duplicate", !sessionStorage.tabID, dup, sessionStorage.tabID ? __getTabState("lock", sessionStorage.tabID) : "")
            _tabID = this.selectTabID();
        } else {
            _tabID = parseInt(sessionStorage.tabID);
        }
        setTabState("lock", "locked", _tabID);
        sessionStorage.tabID = _tabID;
        addEventListener('beforeunload', function () {
            console.warn("beforeunload, deleting lock on tabID", tabID)

            console.warn(JSON.stringify(localStorage))
            console.warn(JSON.stringify(sessionStorage))
            deleteTabState("lock", tabID);

            console.warn(JSON.stringify(localStorage))
            console.warn(JSON.stringify(sessionStorage))
        });


        return _tabID;
    }
}

let tabManager = new TabManager()
export const tabID = tabManager.loadTabID()
console.warn("tabID", tabID) 
