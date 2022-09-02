<svelte:options accessors={true}/>
<script>

    export let data;
    export let rollClass;
    let formula;
    //TODO: избавиться от лишних проверок после создания других классов бросков (не только для урона)
    if (rollClass !== 'Roll') {
        console.log(data);
        formula = data.formula.replaceAll(/[{}]/g, '');
    }
</script>
{#if rollClass === 'Roll'}
    {@html data}
{:else }
    <div class="dice-roll">
        <div class="dice-result">
            <div class="dice-formula">
                {formula}
            </div>
            <div class="dice-tooltip">
                {#each data.tooltip as part}
                    <section class="tooltip-part">
                        <div class="dice">
                            <header class="part-header flexrow">
                                <span class="part-formula">{part.formula}</span>

                            </header>
                        </div>
                    </section>
                {/each}
            </div>
            <div class="dice-total">
                {data.total}
            </div>
        </div>
    </div>
{/if}
<style lang="scss">


</style>