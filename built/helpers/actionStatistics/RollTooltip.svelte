<svelte:options accessors={true}/>
<script>
    import { slide } from "svelte/transition";

    export let data;
    export let rollClass;
    export let hit;
    let formula;
    //TODO: избавиться от лишних проверок после создания других классов бросков (не только для урона)
    if (rollClass !== 'Roll') {
        formula = data.formula.replaceAll(/[{} ]/g, '');
    }

    let expanded = false;
</script>
{#if rollClass === 'Roll'}
    {@html data}
{:else }
    <div class="dice-roll">
        <div class="dice-result">
            <div on:click={()=>expanded=!expanded} class="dice-formula">
                {formula}
            </div>
            {#if expanded}
                <div class="dice-tooltip" transition:slide|local>
                    {#each data.dice as part}
                        <section class="tooltip-part">
                            <div class="dice">
                                <header class="part-header flexrow">
                                    <span class="part-formula">{part.formula}</span>
                                    {#if part.options.damageType}
                                        <span class="part-flavor">{part.options.damageType[0].label}</span>
                                    {/if}
                                    <span class="part-total">{part.total}</span>
                                </header>
                                <ol class="dice-rolls">
                                    {#each part.values as result}
                                        <li class="roll">{result}</li>
                                    {/each}
                                </ol>
                            </div>
                        </section>
                    {/each}
                </div>
            {/if}
            <div class="dice-total" class:hit>
                {data.total}
            </div>
        </div>
    </div>
{/if}
<style lang="scss">
  .dice-formula {
    cursor: pointer;
    padding: 0 5px;
  }

  .dice-tooltip {
    display: block;
    order: 1;
  }

  .part-formula {
    margin-right: 5px;
  }

  .dice-total {
    color: red;

    &.hit {
      color: green
    }
  }

</style>