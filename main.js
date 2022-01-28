PIXI.utils.skipHello();
const app = new PIXI.Application({
  width: 400,
  height: 400,
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
const $body = $('body');
const $result = $('#result');

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

  const result = new Promise((resolve) => {
    const img = app.renderer.plugins.extract.image(app.stage);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 400;
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        (size - img.naturalWidth) / 2,
        (size - img.naturalHeight) / 2
      );
      resolve(canvas.toDataURL());
      canvas.width = canvas.height = 0;
    };
  });

  avatar.destroy(true);
  shape.destroy(true);
  mask.destroy(true);

  return result;
}

async function open(file) {
  if (!file) return;
  let name;
  let dataURL;
  if (typeof file === 'string') {
    name = file;
    dataURL = file;
  }
  else {
    name = file.name;
    dataURL = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
  const href = await renderAvatar(dataURL);
  $download.download = name.replace(/\.([a-z]{3,4})$/, '') + ".png";
  $body.classList.remove('empty');
  $body.classList.add('open');
  $download.href = href;
  $result.appendChild(app.view);
}

$imageInput.addEventListener('change', async (event) => {
  const [file] = event.currentTarget.files;
  open(file);
});

$clear.addEventListener('click', () => {
  $imageInput.value = '';
  $body.classList.remove('open');
  $body.classList.add('empty');
  $result.removeChild(app.view);
});