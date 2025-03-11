'use strict';

export function main() {
    sessionStorage.bla0 = "1";
    sessionStorage.bla1 = "1";
    sessionStorage.bla2 = "1";

    setTimeout(() => {
        sessionStorage.bla2 = "2";
    }, 1000);
}
