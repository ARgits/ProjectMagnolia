<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  //
  const actor = document.actor
  const { application } = getContext("external");
  //create list of changes and context for it
  const changes = writable([]);
  setContext("chaAdvXpChanges", changes);
  //create context for formulas from setting, CONFIG data, Actor's ID
  setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));
  setContext("chaAdvCONFIG", CONFIG);
  setContext("chaAdvActorOriginalData", actor.system);
  setContext("chaAdvAditionalData", document.aditionalData);

  //create store and context for data
  //TODO: add features and other stuff
  const actorData = writable({
    attributes: duplicate(actor.system.attributes),
    skills: duplicate(actor.system.skills),
    advancement: duplicate(actor.system.advancement),
    proficiencies: duplicate(actor.system.proficiencies),
    health: duplicate(actor.system.health),
    isReady: duplicate(actor.system.isReady),
    features: duplicate(document.aditionalData.feats.awail),
  });
  const elementParameters=writable({
    boxHeight:0,
    trHeight:0,
    trWidth:0,
    theadHeight:0,
  })
  setContext("chaAdvElementParameters",elementParameters)
  setContext("chaAdvActorData", actorData);

  //create tabs
  //TODO: create features, races and other tabs
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: AttributeComp },
    { label: "Features", id: "features", component: AttributeComp },
  ];
  //select first tab when app initialized
  const activeTab = "attributes";
  $: console.log($actorData, $changes);
  //update actor and do other stuff when click 'submit' button
  async function submitData() {
    const updateObj = {};
    updateObj["system.attributes"] = $actorData.attributes;
    updateObj["system.skills"] = $actorData.skills;
    updateObj["system.advancement.xp"] = $actorData.advancement.xp;
    updateObj["system.isReady"] = true;
    console.log($actorData.features);
    let feats = { new: [], exist: [] };
    $actorData.features.forEach((element) => {
      const initLevel = element.system.level.initial;
      const currentLevel = element.system.level.current;
      if (initLevel > currentLevel) {
        if (currentLevel > 0) {
          feats.exist = [...feats.exist, element];
        } else {
          feats.new = [...feats.new, element];
        }
      }
    });
    console.log(feats, "feats on update");
    await actor.update(updateObj);
    if (feats.exist.length !== 0) await actor.updateEmbeddedDocuments("Item", feats.exist);
    if (feats.new.length !== 0) await actor.createEmbeddedDocuments("Item", feats.new);
    application.close();
  }
</script>

<div>
  XP get: {$actorData.advancement.xp.get}
</div>
<div>
  XP used: {$actorData.advancement.xp.used}
</div>
<Tabs {tabs} {activeTab} />
<button on:click={submitData}>SubmitData</button>
