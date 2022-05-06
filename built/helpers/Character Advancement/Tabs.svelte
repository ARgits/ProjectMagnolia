<script>
  import { getContext } from "svelte";
  export let tabs = [];
  export let activeTab;
  const data = getContext("chaAdvActorData");
  const element = getContext("chaAdvElementParameters")
  let minBoxSize;
  $: {
    minBoxSize = Object.entries($data[activeTab]).length * $element.trHeight;
  }
</script>

<ul>
  {#each tabs as tab}
    <li class={activeTab === tab.id ? "active" : ""}>
      <span
        on:click={() => {
          activeTab = tab.id;
        }}>{tab.label}</span
      >
    </li>
  {/each}
</ul>
<div class="box" style="--minBoxSize:{minBoxSize}px" bind:clientHeight={$element.boxHeight}>
  {#each tabs as tab}
    {#if tab.id === activeTab}
      <svelte:component this={tab.component} tabData={tab.id}/>
    {/if}
  {/each}
</div>

<style>
  .box {
    margin-bottom: 10px;
    border: 1px solid #dee2e6;
    border-radius: 0 0 0.5rem 0.5rem;
    border-top: 0;
    height: min(70%, max(30%, var(--minBoxSize)));
    /*overflow-y: auto;*/
    background: rgba(0, 0, 0, 0.08);
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0;
    margin-bottom: 0;
    list-style: none;
    border-bottom: 1px solid #dee2e6;
  }
  li:active {
    margin-bottom: -0.1em;
    transform: translateY(0.1em);
  }

  span {
    border: 1px solid transparent;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    display: block;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  span:hover {
    border-color: #e9ecef #e9ecef #dee2e6;
  }

  li.active > span {
    color: white;
    background-color: rgba(0, 0, 0, 0.08);
    border-color: #dee2e6 #dee2e6 #fff;
  }
</style>
