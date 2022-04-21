<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  setContext('chaAdvCONFIG',CONFIG)
  setContext("chaAdvActorID", document.id);
  const data = writable({
    attributes: duplicate(document.data.data.attributes),
    skills: duplicate(document.data.data.skills),
    advancement: duplicate(document.data.data.advancement),
  });
  console.log($data);
  setContext("chaAdvActorData", data);
  const id = getContext("chaAdvActorID");
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: SkillComp },
  ];
  const activeTab = "attributes";
  const { application } = getContext("external");
  function submitData() {
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
