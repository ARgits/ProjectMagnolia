<script>
    import { getContext } from "svelte";
    export let tabs = [];
    export let activeTab;
  </script>
  
  <ul>
    {#each tabs as tab}
      <li class={activeTab === tab.id ? "active" : ""}>
        <span
          on:click={() => {
            activeTab = tab.id;
          }}
        >
          {tab.label}
        </span>
      </li>
    {/each}
  </ul>
  <div class="box">
    {#each tabs as tab}
      {#if tab.id === activeTab}
        <svelte:component this={tab.component}/>
      {/if}
    {/each}
  </div>
  
  <style lang="scss">
    .box {
      margin-bottom: 10px;
      border: 1px solid #dee2e6;
      border-radius: 0 0 0.5rem 0.5rem;
      border-top: 0;
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
    li {
      &:active {
        margin-bottom: -0.1em;
        transform: translateY(0.1em);
      }
      &.active > span {
        color: white;
        background-color: rgba(0, 0, 0, 0.08);
        border-color: #dee2e6 #dee2e6 #fff;
      }
    }
  
    span {
      border: 1px solid transparent;
      border-top-left-radius: 0.25rem;
      border-top-right-radius: 0.25rem;
      display: block;
      padding: 0.5rem 1rem;
      cursor: pointer;
      &:hover {
        border-color: #e9ecef #e9ecef #dee2e6;
      }
    }
  </style>
  