import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';

import 'vtk.js/Sources/favicon';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';

@Component({
  selector: 'app-arrowsource',
  templateUrl: './arrowsource.component.html',
  styleUrls: ['./arrowsource.component.css']
})
export class ArrowsourceComponent implements OnInit {

  renderWindow = vtkRenderWindow.newInstance();
  renderer = vtkRenderer.newInstance({background: [0, 0, 0]});
  pipelines = null;
  openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
  directionElems;

  constructor(private elRef: ElementRef, private renderer2: Renderer2) { }

  ngOnInit(): void {

    this.directionElems = this.elRef.nativeElement.querySelectorAll('.direction');

    this.pipelines = [this.createArrowPipeLine()];

    this.renderer.resetCamera();
    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
    this.renderWindow.addRenderer(this.renderer);
    this.renderWindow.addView(this.openglRenderWindow);

    const container = this.elRef.nativeElement.querySelector('.content');
    this.openglRenderWindow.setContainer(container);

    const {width, height} = container.getBoundingClientRect();
    this.openglRenderWindow.setSize(width, height);

    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(this.openglRenderWindow);
    interactor.initialize();
    interactor.bindEvents(container);
    interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

    this.initializeControlEvent();

    for (const element of this.directionElems) {
        this.renderer2.listen(element, 'input', this.updateTransformedArrow.bind(this));
    }

    const resetBtn = this.elRef.nativeElement.querySelector('.reset');
    this.renderer2.listen(resetBtn, 'click', this.resetUI.bind(this));
  }

  createArrowPipeLine(): object {
    const arrowSource = vtkArrowSource.newInstance();
    const actor = vtkActor.newInstance();
    const mapper = vtkMapper.newInstance();

    actor.setMapper(mapper);
    actor.getProperty().setEdgeVisibility(true);
    actor.getProperty().setEdgeColor(1, 0, 0);
    actor.getProperty().setRepresentationToSurface();
    mapper.setInputConnection(arrowSource.getOutputPort());

    this.renderer.addActor(actor);
    return { arrowSource, mapper, actor };
  }

  initializeControlEvent(): void {
    [
      'tipResolution',
      'tipRadius',
      'tipLength',
      'shaftResolution',
      'shaftRadius',
    ].forEach((propertyName) => {
      const current = this.elRef.nativeElement.querySelector(`.${propertyName}`);

      this.renderer2.listen(current, 'input', (e) => {
        const value = Number(e.target.value);
        this.pipelines[0].arrowSource.set({ [propertyName]: value });
        this.renderer.resetCameraClippingRange();
        this.renderWindow.render();

      });

    });

  }

  updateTransformedArrow(): void {
    const direction = [1, 0, 0];
    for (const element of this.directionElems) {
      direction[Number(element.dataset.index)] = Number(
        element.value
      );
    }
    this.pipelines[0].arrowSource.set({ direction });
    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
  }


  resetUI(): void {

    const defaultTipResolution = 6;
    const defaultTipRadius = 0.1;
    const defaultTipLength = 0.35;
    const defaultShaftResolution = 6;
    const defaultShaftRadius = 0.03;
    const direction = [1, 0, 0];

    this.renderer2.setValue(this.elRef.nativeElement.querySelector(`.tipResolution`), String(defaultTipResolution));
    this.pipelines[0].arrowSource.set({ tipResolution: Number(defaultTipResolution) });

    this.renderer2.setValue(this.elRef.nativeElement.querySelector(`.tipRadius`), String(defaultTipRadius));
    this.pipelines[0].arrowSource.set({ tipRadius: Number(defaultTipRadius) });

    this.renderer2.setValue(this.elRef.nativeElement.querySelector(`.tipLength`), String(defaultTipLength));
    this.pipelines[0].arrowSource.set({ tipLength: Number(defaultTipLength) });

    this.renderer2.setValue(this.elRef.nativeElement.querySelector(`.shaftResolution`), String(defaultShaftResolution));
    this.pipelines[0].arrowSource.set({
      shaftResolution: Number(defaultShaftResolution),
    });


    this.renderer2.setValue(this.elRef.nativeElement.querySelector(`.shaftRadius`), String(defaultShaftRadius));
    this.pipelines[0].arrowSource.set({ shaftRadius: Number(defaultShaftRadius) });

    this.elRef.nativeElement.querySelector(`.invert`).checked = false;
    this.pipelines[0].arrowSource.set({ invert: false });

    for (let i = 0; i < 3; i++) {
      this.directionElems[i].value = Number(direction[i]);
    }

    this.pipelines[0].arrowSource.set({ direction });
  
    this.renderer.resetCamera();
    this.renderer.resetCameraClippingRange();
    this.renderWindow.render();
  }

}
