<svelte:options accessors={true} />

<script>
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document;
  setContext("chaAdvActorID", document.id);
  const data = writable(document.data.data);
  const id = getContext('chaAdvActorID')
  console.log(id, 'id')
  const actorData = game.actors.get(id).data.data
  console.log($data);
  setContext("chaAdvActorData", data);
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp },
    { label: "skills", id: "skills", component: SkillComp },
  ];
  const activeTab = "attributes";
  onDestroy(() => {
	console.log('app is closing')
	console.log($data,'$data before')
	console.log(actorData,'document itself')
    $data = actorData;
	console.log($data,'$data after')
  });
</script>

<Tabs {tabs} {activeTab} />
