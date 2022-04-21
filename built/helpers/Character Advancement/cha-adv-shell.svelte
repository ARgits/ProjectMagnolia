<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  //create list of changes and context for it
  const changes = writable([]);
  setContext("chaAdvXpChanges", changes);
  //create context for formulas from setting, CONFIG data, Actor's ID
  setContext("chaAdvXpFormulas", game.settings.get("ard20", "advancement-rate"));
  setContext("chaAdvCONFIG", CONFIG);
  setContext("chaAdvActorID", document.id);

  //create store and context for data
  //TODO: add features and other stuff
  const data = writable({
    attributes: duplicate(document.data.data.attributes),
    skills: duplicate(document.data.data.skills),
    advancement: duplicate(document.data.data.advancement),
  });
  setContext("chaAdvActorData", data);

  //create tabs
  //TODO: create features, races and other tabs
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: SkillComp },
  ];
  //select first tab when app initialized
  const activeTab = "attributes";

  //update actor and do other stuff when click 'submit' button
  function submitData() {
    const { application } = getContext("external");
    const id = getContext("chaAdvActorID");
    const updateObj = {};
    updateObj["data.attributes"] = $data.attributes;
    updateObj["data.skills"] = $data.skills;
    updateObj["data.advancement.xp"] = $data.advancement.xp;
    updateObj["data.isReady"] = true;
    game.actors.get(id).update(updateObj);
    application.close();
  }
</script>

<div>
  XP get: {$data.advancement.xp.get}
</div>
<div>
  XP used: {$data.advancement.xp.used}
</div>
<Tabs {tabs} {activeTab} />
<button on:click={submitData}>SubmitData</button>
