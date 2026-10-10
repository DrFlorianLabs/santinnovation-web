import { matchesDirectory } from '../lib/directory';
for (const root of document.querySelectorAll<HTMLElement>('[data-directory]')) {
  const form = root.querySelector<HTMLFormElement>('[data-filters]')!;
  const name = root.querySelector<HTMLInputElement>('#pro-name')!;
  const profession = root.querySelector<HTMLSelectElement>('#pro-profession')!;
  const lieu = root.querySelector<HTMLSelectElement>('#pro-lieu')!;
  const filter = () => {
    let count = 0;
    for (const card of root.querySelectorAll<HTMLElement>('[data-pro]')) {
      const matches = matchesDirectory(card.dataset.name ?? '', name.value,
        JSON.parse(card.dataset.professions ?? '[]'), profession.value,
        JSON.parse(card.dataset.lieux ?? '[]'), lieu.value);
      card.hidden = !matches;
      if (matches) count++;
    }
    root.querySelector('[data-results]')!.textContent = `${count} professionnel${count > 1 ? 's' : ''}`;
    root.querySelector<HTMLElement>('[data-empty]')!.hidden = count !== 0;
  };
  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
}
