<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;

  //functions to get lists of available features and lists
  async function getPacks() {
    let pack_list = []; // array of feats from Compendium
    let pack_name = [];
    for (const key of game.settings.get("ard20", "feat").packs) {
      if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
        let feat_list = [];
        feat_list.push(
          Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.documentName === "Item")[0].index)
        );
        feat_list = feat_list.flat();
        for (const feat of feat_list) {
          if (feat instanceof ARd20Item) {
            const new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
            const doc = await game.packs.get(new_key).getDocument(feat.id);
            if (doc instanceof ARd20Item) {
              const item = doc.toObject();
              item.data = foundry.utils.deepClone(doc.data.data);
              pack_list.push(item);
              pack_name.push(item.name);
            }
          }
        }
        pack_list = pack_list.flat();
      }
    }
    return {
      pack_list,
      pack_name,
    };
  }
  function getFolders() {
    let folder_list = []; // array of feats from game folders
    let folder_name = [];
    for (let key of game.settings.get("ard20", "feat").folders) {
      if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
        let feat_list = [];
        feat_list.push(
          game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents
        );
        feat_list = feat_list.flat();
        for (let feat of feat_list) {
          if (feat instanceof ARd20Item) {
            console.log("item added from folder ", feat);
            const item = feat.toObject();
            item.data = foundry.utils.deepClone(feat.data.data);
            folder_list.push(item);
            folder_name.push(item.name);
          }
        }
        folder_list = folder_list.flat();
      }
    }
    return {
      folder_list,
      folder_name,
    };
  }
  async function getRacesList(pack, folder) {
    console.log(pack, folder);
    const pack_list = pack.pack_list;
    const pack_name = pack.pack_name;
    const folder_list = folder.folder_list;
    let race_pack_list = [];
    let race_folder_list = [];
    pack_list.forEach((item) => {
      if (item.type === "race") {
        let raceItem = { ...item, chosen: false };
        race_pack_list.push(raceItem);
      }
    });
    folder_list.forEach((item) => {
      if (item.type === "race") {
        let raceItem = { ...item, chosen: false };
        race_folder_list.push(raceItem);
      }
    });
    return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
  }
  async function getFeaturesList(pack, folder) {
    console.log(pack, folder);
    const pack_list = pack.pack_list;
    const pack_name = pack.pack_name;
    const folder_list = folder.folder_list;
    let feat_pack_list = [];
    pack_list.forEach((item) => {
      if (item.type === "feature") {
        let FeatureItem = { ...item, currentXP: 0, isEq: false, isXP: false };
        feat_pack_list.push(FeatureItem);
      }
    });
    let feat_folder_list = [];
    folder_list.forEach((item) => {
      if (item.type === "feature") {
        let FeatureItem = { ...item, currentXP: 0, isEq: false, isXP: false };
        feat_folder_list.push(FeatureItem);
      }
    });
    let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
    let learnedFeatures = [];
    this.object.itemTypes.feature.forEach((item) => {
      if (item.data.type === "feature") {
        let FeatureItem = { ...item.data, currentXP: 0, isEq: false };
        learnedFeatures.push(FeatureItem);
      }
    });
    return { temp_feat_list, learnedFeatures };
  }
  //

  const { application } = getContext("external");
  //create list of changes and context for it
  const changes = writable([]);
  setContext("chaAdvXpChanges", changes);
  //create context for formulas from setting, CONFIG data, Actor's ID
  setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));
  setContext("chaAdvCONFIG", CONFIG);
  setContext("chaAdvActorOriginalData", document.data.data);
  setContext("chaAdvActorID", document.id);
  let pack = {};
  let folder = getFolders();
  let raceList = [];
  let featList = [];
  getPacks().then((result) => {
    console.log(result,'getPacks result');
    pack = result;
    console.log(pack)
  });
  getRacesList(pack, folder).then((result) => {
    console.log(result,'getRacesList result');
    raceList = result;
    console.log(raceList)
  });
  getFeaturesList(pack, folder).then((result) => {
    console.log(result,'getFeaturesList result');
    featList = result;
    console.log(featList)
  });
  console.log(pack, folder, raceList, featList);
  //create store and context for data
  //TODO: add features and other stuff
  const data = writable({
    actorData: {
      attributes: duplicate(document.data.data.attributes),
      skills: duplicate(document.data.data.skills),
      advancement: duplicate(document.data.data.advancement),
      proficiencies: duplicate(document.data.data.proficiencies),
      health: duplicate(document.data.data.health),
      isReady: duplicate(document.data.data.isReady),
    },
    races: { list: raceList, chosen: "" },
    count: {
      //TODO: rework this for future where you can have more/less ranks
      skills: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
      feats: { mar: 0, mag: 0, div: 0, pri: 0, psy: 0 },
    },
    feats: {
      learned: featList.learnedFeatures,
      awail: featList.temp_feat_list,
    },
    allow: {
      attribute: duplicate(document.data.data.isReady),
      race: duplicate(document.data.data.isReady),
      final: duplicate(document.data.data.isReady),
    },
  });
  setContext("chaAdvActorData", data);

  //create tabs
  //TODO: create features, races and other tabs
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: AttributeComp },
  ];
  //select first tab when app initialized
  const activeTab = "attributes";
  $: console.log($data, $changes);
  const id = getContext("chaAdvActorID");
  //update actor and do other stuff when click 'submit' button
  function submitData() {
    const updateObj = {};
    updateObj["data.attributes"] = $data.actorData.attributes;
    updateObj["data.skills"] = $data.actorData.skills;
    updateObj["data.advancement.xp"] = $data.actorData.advancement.xp;
    updateObj["data.isReady"] = true;
    game.actors.get(id).update(updateObj);
    application.close();
  }
</script>

<div>
  XP get: {$data.actorData.advancement.xp.get}
</div>
<div>
  XP used: {$data.actorData.advancement.xp.used}
</div>
<Tabs {tabs} {activeTab} />
<button on:click={submitData}>SubmitData</button>
