export default function decorate(widget) {
  widget.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
  });
}
