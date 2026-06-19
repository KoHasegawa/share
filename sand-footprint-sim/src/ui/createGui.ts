import GUI from 'lil-gui';
import { SandParams } from '../sand/sandParams';

export interface CreateGuiOptions {
  onWash: () => void;
}

export function createGui(params: SandParams, opts: CreateGuiOptions): GUI {
  const container = document.getElementById('gui-container');
  const gui = new GUI({
    title: 'Sand Controls',
    container: container instanceof HTMLElement ? container : undefined
  });

  gui.close();

  const sandFolder = gui.addFolder('Sand');
  sandFolder.add(params, 'moisture', 0, 1, 0.01).name('Moisture');
  sandFolder.add(params, 'hardness', 0, 1, 0.01).name('Hardness');
  sandFolder.add(params, 'grainSize', 0, 1, 0.01).name('Grain Size');
  sandFolder.add(params, 'cohesion', 0, 1, 0.01).name('Cohesion');

  // Sand colour gradient: 0 = white beach, 0.5 = golden, 1 = deep brown.
  const toneCtrl = sandFolder.add(params, 'sandTone', 0, 1, 0.01).name('Color (white→brown)');
  const colorPresets = {
    'White Beach': (): void => {
      toneCtrl.setValue(0.05);
    },
    Golden: (): void => {
      toneCtrl.setValue(0.5);
    },
    Brown: (): void => {
      toneCtrl.setValue(1.0);
    }
  };
  sandFolder.add(colorPresets, 'White Beach').name('▸ White Beach');
  sandFolder.add(colorPresets, 'Golden').name('▸ Golden');
  sandFolder.add(colorPresets, 'Brown').name('▸ Brown');
  sandFolder.open();

  const footprintFolder = gui.addFolder('Footprint');
  footprintFolder.add(params, 'bodyWeight', 0, 1, 0.01).name('Body Weight');
  footprintFolder.add(params, 'footprintDepth', 0, 1, 0.01).name('Depth');
  footprintFolder.add(params, 'rimHeight', 0, 1, 0.01).name('Rim Height');
  footprintFolder.add(params, 'edgeCollapse', 0, 1, 0.01).name('Edge Collapse');
  footprintFolder.open();

  const agingFolder = gui.addFolder('Aging');
  agingFolder.add(params, 'decaySpeed', 0, 1, 0.01).name('Decay Speed');
  agingFolder.add(params, 'darkeningStrength', 0, 1, 0.01).name('Darkening');

  const noiseFolder = gui.addFolder('Noise');
  noiseFolder.add(params, 'noiseStrength', 0, 1, 0.01).name('Noise Strength');

  const actions = {
    Wash: (): void => {
      opts.onWash();
    }
  };
  gui.add(actions, 'Wash');

  return gui;
}
