<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  //
  const actor = game.actors.get(document.id);
  const { application } = getContext("external");
  //create list of changes and context for it
  const changes = writable([]);
  setContext("chaAdvXpChanges", changes);
  //create context for formulas from setting, CONFIG data, Actor's ID
  setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));
  setContext("chaAdvCONFIG", CONFIG);
  setContext("chaAdvActorOriginalData", actor.data.data);
  setContext("chaAdvActorID", document.id);
  setContext("chaAdvAditionalData", document.aditionalData);

  //create store and context for data
  //TODO: add features and other stuff
  const actorData = writable({
    attributes: duplicate(actor.data.data.attributes),
    skills: duplicate(actor.data.data.skills),
    advancement: duplicate(actor.data.data.advancement),
    proficiencies: duplicate(actor.data.data.proficiencies),
    health: duplicate(actor.data.data.health),
    isReady: duplicate(actor.data.data.isReady),
    features: duplicate(document.aditionalData.feats.awail),
  });
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
  const id = getContext("chaAdvActorID");
  //update actor and do other stuff when click 'submit' button
  async function submitData() {
    const updateObj = {};
    updateObj["data.attributes"] = $actorData.attributes;
    updateObj["data.skills"] = $actorData.skills;
    updateObj["data.advancement.xp"] = $actorData.advancement.xp;
    updateObj["data.isReady"] = true;
    let feats = $actorData.features.filter((feat) => {
      feat.data.level.initial > feat.data.level.current;
    });
    console.log(feats,'feats on update')
    await actor.update(updateObj);
    await actor.createEmbeddedDocuments("Item", feats);
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
