import repl from 'repl';

function READ(str: string): string {
    return str;
}

function EVAL(exp: string): any {
    return exp;
}

function PRINT(exp: any): string {
    return exp;
}

function rep(str: string): string {
    return PRINT(EVAL(READ(str)));
}

function main() {
    function malEval(cmd: string, context: any, filename: string, callback: Function) {
        try {
            callback(null, rep(cmd.trim()));
        } catch (e) {
            callback(new repl.Recoverable(e));
        }
    }

    repl.start({ prompt: '> ', eval: malEval });
}

main();
