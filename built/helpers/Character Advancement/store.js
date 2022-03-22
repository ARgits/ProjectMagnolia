import { writable } from "svelte/store";
const data = writable({
  attributes: {
    str: {
      value: 5,
    },
    dex: {
      value: 5,
    },
    int: {
      value: 5,
    },
    con: {
      value: 5,
    },
    wis: {
      value: 5,
    },
    cha: {
      value: 5,
    },
  },
  skills: {
    acr: {
      level: 0,
    },
    ath: {
      level: 0,
    },
    ani: {
      level: 0,
    },
    arc: {
      level: 0,
    },
    dec: {
      level: 0,
    },
    his: {
      level: 0,
    },
    ins: {
      level: 0,
    },
    itm: {
      level: 0,
    },
    inv: {
      level: 0,
    },
    med: {
      level: 0,
    },
    nat: {
      level: 0,
    },
    prc: {
      level: 0,
    },
    prf: {
      level: 0,
    },
    per: {
      level: 0,
    },
    rel: {
      level: 0,
    },
    slt: {
      level: 0,
    },
    ste: {
      level: 0,
    },
    sur: {
      level: 0,
    },
  },
});
