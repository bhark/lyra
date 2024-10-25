<script>

    let { children } = $props()

</script>

<div id="nav">
    <span class="tetrabit">Tetrabit</span>
    <span class="lyra">Lyra</span>
</div>

<div id="content">
    {@render children()}
</div>

<style lang="scss" global>

    @use 'src/styles/main.scss' as *;
    @use 'src/styles/variables.scss' as *;

    #content {
        padding-top: 80px;
    }

    #nav {
        position: fixed;
        top: 0;
        left: 0;
        width: 100dvw;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: $standard-padding;
        border-bottom: solid 1px $black;
        background-color: $sand;
        z-index: 999;

        span {
            font-size: 2rem;
            text-transform: uppercase;
        }
    }

</style>