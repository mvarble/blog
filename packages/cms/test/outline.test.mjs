// Slugs decide what every section anchor on the site is called, so these pin
// them directly rather than through a fixture build.
import test from 'node:test';
import assert from 'node:assert/strict';

const { slugifyHeading, headingSlugs, buildOutline } = await import('../src/model/outline.ts');

test('a slug is lowercase words joined by hyphens', () => {
    assert.equal(
        slugifyHeading('Pseudorandom number generation'),
        'pseudorandom-number-generation',
    );
});

test('punctuation collapses rather than accumulating hyphens', () => {
    assert.equal(slugifyHeading('(Unfair) Bernoulli measure'), 'unfair-bernoulli-measure');
    assert.equal(slugifyHeading("Let's goooo! 🏂"), 'let-s-goooo');
    assert.equal(slugifyHeading('IEEE-754'), 'ieee-754');
});

test('repeated titles are suffixed in order', () => {
    assert.deepEqual(headingSlugs(['Notation', 'Setup', 'Notation', 'Notation']), [
        'notation',
        'setup',
        'notation-2',
        'notation-3',
    ]);
});

test('a title with nothing sluggable falls back to its position', () => {
    // Letters inside math still slugify ('$\\bbR$' -> 'bbr'); this is for a
    // title that has no alphanumerics at all.
    assert.deepEqual(headingSlugs(['Setup', '⟶', '⟶']), ['setup', 'section-1', 'section-2']);
});

const h = (depth, title) => ({ depth, title, slug: title.toLowerCase() });
const shape = (entries) =>
    entries.map(({ title, children }) => (children.length ? { [title]: shape(children) } : title));

test('h2s nest under the h1 above them', () => {
    const outline = buildOutline([h(1, 'A'), h(2, 'A1'), h(2, 'A2'), h(1, 'B'), h(2, 'B1')]);
    assert.deepEqual(shape(outline), [{ A: ['A1', 'A2'] }, { B: ['B1'] }]);
});

test('an h2 before any h1 stands on its own', () => {
    // Dropping it would silently lose a section from the table of contents.
    const outline = buildOutline([h(2, 'orphan'), h(1, 'A'), h(2, 'A1')]);
    assert.deepEqual(shape(outline), ['orphan', { A: ['A1'] }]);
});

test('a document of only h1s is flat', () => {
    assert.deepEqual(shape(buildOutline([h(1, 'A'), h(1, 'B')])), ['A', 'B']);
});

test('no headings is an empty outline', () => {
    assert.deepEqual(buildOutline([]), []);
});
