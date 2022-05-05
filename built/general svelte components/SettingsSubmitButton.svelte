<script>
  export let setting;
  export let data;
  function SubmitSetting(setting, data) {
    game.settings.set("ard20", setting, data);
  }
</script>

<button on:click={() => SubmitSetting(setting, data)}>Submit</button>
