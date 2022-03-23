import instantsearch from 'instantsearch.js';
import { connectSearchBox } from 'instantsearch.js/es/connectors';
import historyRouter from 'instantsearch.js/es/lib/routers/history';
import {configure,hierarchicalMenu,hits,pagination,panel,} from 'instantsearch.js/es/widgets';

import { debounce } from '../src/debounce';
import { searchClient } from '../src/searchClient';

export const INSTANT_SEARCH_INDEX_NAME = 'CTL_hermanmiller_products_data';
export const INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE =
  'hierarchicalCategories.en.lvl0';

const instantSearchRouter = historyRouter();

export const search = instantsearch({
  searchClient,
  indexName: INSTANT_SEARCH_INDEX_NAME,
  routing: instantSearchRouter,
});
const virtualSearchBox = connectSearchBox(() => {});
const hierarchicalMenuWithHeader = panel({
  templates: { header: 'Categories' },
})(hierarchicalMenu);

search.addWidgets([
  configure({
    attributesToSnippet: ['name:7', 'description:15'],
    snippetEllipsisText: '…',
  }),
  // Mount a virtual search box to manipulate InstantSearch's `query` UI
  // state parameter.
  virtualSearchBox(),
  hierarchicalMenuWithHeader({
    container: '#categories',
    attributes: [
      INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE,
      'hierarchicalCategories.en.lvl1',
      'hierarchicalCategories.en.lvl2',
    ],
  }),
  hits({
    container: '#hits',
    transformItems(items) {
      console.log(items)
      return items.map((item) => ({
        ...item,
        name:item.name,
        image:item.images[0].url,
        category:"Furniture",
        comments: "comments",
        sale:`$ ${(item.price.centAmount / 100)}.00`,
        // eslint-disable-next-line @typescript-eslint/camelcase
        sale_price: 23,
      }));
    },
    templates: {
      item: `
        <article class="hit">
          <div class="hit-image">
            <img src="{{image}}" alt="{{name.en}}">
          </div>
          <div>
            <h1>
              {{name.en}}
            </h1>
            <div>            
              <strong>{{sale}}</strong>
            </div>
          </div>
          </div>
        </article>
      `,
    },
  }),
  pagination({
    container: '#pagination',
    padding: 2,
    showFirst: false,
    showLast: false,
  }),
]);

// Set the InstantSearch index UI state from external events.
export function setInstantSearchUiState(indexUiState) {
  search.setUiState((uiState) => ({
    ...uiState,
    [INSTANT_SEARCH_INDEX_NAME]: {
      ...uiState[INSTANT_SEARCH_INDEX_NAME],
      // We reset the page when the search state changes.
      page: 1,
      ...indexUiState,
    },
  }));
}

export const debouncedSetInstantSearchUiState = debounce(
  setInstantSearchUiState,
  500
);

// Get the current category from InstantSearch.
export function getInstantSearchCurrentCategory() {
  const indexUiState = search.getUiState()[INSTANT_SEARCH_INDEX_NAME];
  const hierarchicalMenuUiState = indexUiState && indexUiState.hierarchicalMenu;
  const currentCategories =
    hierarchicalMenuUiState &&
    hierarchicalMenuUiState[INSTANT_SEARCH_HIERARCHICAL_ATTRIBUTE];

  return currentCategories && currentCategories[0];
}

// Build URLs that InstantSearch understands.
export function getInstantSearchUrl(indexUiState) {
  return search.createURL({ [INSTANT_SEARCH_INDEX_NAME]: indexUiState });
}

// Return the InstantSearch index UI state.
export function getInstantSearchUiState() {
  const uiState = instantSearchRouter.read();

  return (uiState && uiState[INSTANT_SEARCH_INDEX_NAME]) || {};
}
