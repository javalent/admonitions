const config = {
    onwarn: (warning, handler) => {
        if (warning.code.toLowerCase().startsWith("a11y-")) {
            return;
        }
        handler(warning);
    }
};
