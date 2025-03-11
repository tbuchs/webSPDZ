import { ITheme } from 'xterm';

export const ANSI_COLOR_THEME: ITheme = {
    /** ANSI black (eg. `\x1b[30m`) */
    black: '\x1b[30m',
    /** ANSI red (eg. `\x1b[31m`) */
    red: '\x1b[31m',
    /** ANSI green (eg. `\x1b[32m`) */
    green: '\x1b[32m',
    /** ANSI yellow (eg. `\x1b[33m`) */
    yellow: '\x1b[33m',
    /** ANSI blue (eg. `\x1b[34m`) */
    blue: '\x1b[34m',
    /** ANSI magenta (eg. `\x1b[35m`) */
    magenta: '\x1b[35m',
    /** ANSI cyan (eg. `\x1b[36m`) */
    cyan: '\x1b[36m',
    /** ANSI white (eg. `\x1b[37m`) */
    white: '\x1b[37m',
    /** ANSI bright black (eg. `\x1b[1;30m`) */
    brightBlack: '\x1b[1;30m',
    /** ANSI bright red (eg. `\x1b[1;31m`) */
    brightRed: '\x1b[1;31m',
    /** ANSI bright green (eg. `\x1b[1;32m`) */
    brightGreen: '\x1b[1;32m',
    /** ANSI bright yellow (eg. `\x1b[1;33m`) */
    brightYellow: '\x1b[1;33m',
    /** ANSI bright blue (eg. `\x1b[1;34m`) */
    brightBlue: '\x1b[1;34m',
    /** ANSI bright magenta (eg. `\x1b[1;35m`) */
    brightMagenta: '\x1b[1;35m',
    /** ANSI bright cyan (eg. `\x1b[1;36m`) */
    brightCyan: '\x1b[1;36m',
    /** ANSI bright white (eg. `\x1b[1;37m`) */
    brightWhite: '\x1b[1;37m',
};

export type ANSI_COLOR = keyof typeof ANSI_COLOR_THEME;

export interface AnsiColorMappingRule {
    pattern: string;
    color: string;
}

export const colorize = (text: string, rules: AnsiColorMappingRule[] = []) => {
    return rules.reduce((prev, rule) => {
        return (
            prev +
            text.replace(new RegExp(rule.pattern, 'gi'), ($1: string) => {
                return rule.color + $1 + ANSI_COLOR_THEME.brightWhite;
            })
        );
    }, ANSI_COLOR_THEME.brightWhite);
};