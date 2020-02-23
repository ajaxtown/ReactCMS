#!/bin/bash
set -e
run_dev () {
    clean_up
    THEME=$1
    if [ -z "$THEME" ]; then
        THEME=hugo
    fi
    
    export THEME=$THEME
    export NODE_ENV=dev
    
    webpack --config ./webpack/webpack.dev.js --env.theme=$THEME
    yarn ts-node ./src/start.ts --profile --json
}

run_production () {
    node ./dist/server.js
}

build_letterpad_with_theme () {
    clean_up
    
    THEME=$1
    if [ -z "$THEME" ]; then
        THEME=hugo
    fi
    
    export THEME=$THEME
    
    yarn tsc --build tsconfig.build.json &
    yarn tsc --build "src/client/themes/$THEME/tsconfig.json" &
    yarn webpack --env.NODE_ENV=production --config webpack/webpack.prod.js --env.theme=$THEME
}

build_theme () {
    THEME=$1
    if [ -z "$THEME" ]; then
        THEME=hugo
    fi
    
    export THEME=$THEME
    echo $THEME
    tsc --build "src/client/themes/$THEME/tsconfig.json" &
    webpack --env.NODE_ENV=production --config webpack/webpack.prod.js --env.theme=$THEME
}

build_admin () {
    THEME=$1
    if [ -z "$THEME" ]; then
        THEME=hugo
    fi
    
    export THEME=$THEME
    tsc --build tsconfig.build.json &
    webpack --env.NODE_ENV=production --config webpack/webpack.admin.prod.js --env.theme=$THEME
}

clean_up() {
    rm *.hot-update.json || :
    echo "Removed *.hot-update.json"
    rm -rf runtime~src || :
    echo "Removed runtime~src"
    rm -rf src/admin/public/dist || :
    echo "Removed admin public dist"
    for d in src/client/themes/*/  ; do
        dist="${d}public/dist"
        echo "Removed $dist"
        rm -rf  "$dist" || :
    done
    rm -rf dist || :
    rm vendor-zip.zip  || :
}

COMMAND=$1
THEME=$2

if [ "$COMMAND" = "runDev" ]; then
    run_dev $THEME
elif [ "$COMMAND" = "build" ]; then
    build_letterpad_with_theme $THEME
elif [ "$COMMAND" = "buildTheme" ]; then
    build_theme $THEME
elif [ "$COMMAND" = "buildAdmin" ]; then
    build_admin
elif [ "$COMMAND" = "runProd" ]; then
    run_production
elif [ "$COMMAND" = "cleanUp" ]; then
    clean_up
fi