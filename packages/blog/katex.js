// This file contains the base KaTeX configuration.
//  - Project-wide macros: here
//  - Macros for a specific document: put the YAML contents in the frontmatter
// Macros "fold" from project-wide down the tree of documents and their children.

const alphabet = 'abcdefghijklmnopqrstuvwxyz';
const greeks = [
    ['α', 'alpha'],
    ['β', 'beta'],
    ['γ', 'gamma'],
    ['δ', 'delta'],
    ['ϵ', 'epsilon'],
    ['ζ', 'zeta'],
    ['η', 'eta'],
    ['θ', 'theta'],
    ['ι', 'iota'],
    ['κ', 'kappa'],
    ['λ', 'lambda'],
    ['μ', 'mu'],
    ['ν', 'nu'],
    ['ξ', 'xi'],
    ['π', 'pi'],
    ['ρ', 'rho'],
    ['σ', 'sigma'],
    ['τ', 'tau'],
    ['ϕ', 'phi'],
    ['ψ', 'psi'],
    ['χ', 'chi'],
    ['ω', 'omega'],
];

const titleCase = (str) => str.at(0).toUpperCase() + str.slice(1);

export default {
    macros: {
        ...Object.fromEntries([
            ...alphabet.split('').flatMap((char) => [
                [`\\rm${char}`, `{\\rm ${char}}`],
                [`\\bf${char}`, `\\boldsymbol{${char}}`],
                [`\\rm${char.toUpperCase()}`, `\\mathrm{${char.toUpperCase()}}`],
                [`\\cal${char.toUpperCase()}`, `\\mathcal{${char.toUpperCase()}}`],
                [`\\scr${char.toUpperCase()}`, `\\mathscr{${char.toUpperCase()}}`],
                [`\\bb${char.toUpperCase()}`, `\\mathbb{${char.toUpperCase()}}`],
                [`\\bf${char.toUpperCase()}`, `\\mathbf{${char.toUpperCase()}}`],
            ]),
            ...greeks.flatMap(([char, ident]) => [
                [`\\rm${ident}`, `{\\rm ${char}}`],
                [`\\bf${ident}`, `\\boldsymbol{${char}}`],
                [`\\rm${titleCase(ident)}`, `\\mathrm{${char.toUpperCase()}}`],
                [`\\cal${titleCase(ident)}`, `\\mathcal{${char.toUpperCase()}}`],
                [`\\bf${titleCase(ident)}`, `\\mathbf{${char.toUpperCase()}}`],
            ]),
        ]),
        '\\im': '\\rmi',
        '\\defeq': '\\coloneqq',
        '\\eqdef': '\\eqqcolon',
    },
};
