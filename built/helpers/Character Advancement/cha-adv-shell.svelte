<svelte:options accessors={true} />

<script>
  import {setContext} from 'svelte'
  import {writable} from 'svelte/store'
  import { onDestroy } from 'svelte';
  import AttributeComp from "./Attributes.svelte";
  import SkillComp from "./Skills.svelte";
  import Tabs from "./Tabs.svelte";
  export let document
  setContext('chaAdvActorID',document.id)
  const data = writable(document.data.data)
  console.log($data)
  const unsub = data.subscribe(value=>{})
  setContext('chaAdvActorData',data)
  const tabs = [
    { label: "attributes", id: "attributes", component: AttributeComp},
    { label: "skills", id: "skills", component: SkillComp},
  ];
  const activeTab = "attributes";
  onDestroy(unsub())
</script>

<Tabs {tabs} {activeTab} />
