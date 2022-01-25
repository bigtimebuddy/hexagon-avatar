PIXI.utils.skipHello();
const app = new PIXI.Application({
  width: 500,
  height: 500,
  backgroundColor: 0xffffff,
  resolution: 2,
  autoDensity: true,
});
app.stop();

document.addEventListener('drop', ev => {
  ev.preventDefault();
  const [file] = ev.dataTransfer.files;
  if (file && file.type.startsWith('image/')) {
    open(file);
  }
}, false);
document.addEventListener('paste', ev => {
  if (!ev.clipboardData) return;
    const {items} = ev.clipboardData;
    const file = items[0].getAsFile();
    if (file && file.type.startsWith('image/')) {
      open(file);
    }
}, false);
document.addEventListener('dragover', ev => ev.preventDefault());

const $ = document.querySelector.bind(document);
const $download = $('#downloadButton');
const $imageInput = $('#imageInput');
const $clear = $('#clearButton');

async function renderAvatar(url) {
  const texture = await PIXI.Texture.fromURL(url);
  const avatar = PIXI.Sprite.from(texture);
  avatar.position.set(
    app.screen.width / 2,
    app.screen.height / 2
  );
  avatar.anchor.set(0.5);
  app.stage.addChild(avatar);
  const shape = new PIXI.Graphics()
    .beginFill(0xffff00)
    .drawRoundedPolygon(0, 0, 200, 6, 50, 30 * Math.PI / 180);
  const {
    width,
    height,
    left,
    top
  } = shape.getLocalBounds();
  const maskTexture = PIXI.RenderTexture.create({
    width,
    height
  });
  shape.position.set(-left, -top);
  maskTexture.baseTexture.framebuffer.multisample = PIXI.MSAA_QUALITY.HIGH;
  app.renderer.render(shape, maskTexture);
  app.renderer.framebuffer.blit();

  const mask = PIXI.Sprite.from(maskTexture);
  mask.anchor.set(0.5);
  mask.position.set(app.screen.width / 2, app.screen.height / 2);

  avatar.width = avatar.height = Math.max(mask.width, mask.height);
  avatar.mask = mask;

  app.stage.addChild(mask);
  app.render();

  const result = app.renderer.plugins.extract.base64(app.stage);

  avatar.destroy(true);
  shape.destroy(true);
  mask.destroy(true);

  return result;
}

async function open(file) {
  if (!file) return;
  const dataURL = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  const href = await renderAvatar(dataURL);
  $download.download = file.name.split(".")[0] + ".png";
  $download.classList.remove('hidden');
  $clear.classList.remove('hidden');
  $download.href = href;
  document.body.appendChild(app.view);
}

$imageInput.addEventListener('change', async (event) => {
  const [file] = event.currentTarget.files;
  open(file);
});

$clear.addEventListener('click', () => {
  $imageInput.value = '';
  $download.classList.add('hidden');
  $clear.classList.add('hidden');
  document.body.removeChild(app.view);
});
