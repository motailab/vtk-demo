import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';


import 'vtk.js/Sources/favicon';

import { mat4, vec3 } from 'gl-matrix';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPixelSpaceCallbackMapper from 'vtk.js/Sources/Rendering/Core/PixelSpaceCallbackMapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtk from 'vtk.js/Sources/vtk';

// Need polydata registered in the vtk factory
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/DataArray';
import 'vtk.js/Sources/Common/Core/StringArray';
import 'vtk.js/Sources/Common/DataModel/PolyData';
 

@Component({
  selector: 'app-depth',
  templateUrl: './depth.component.html',
  styleUrls: ['./depth.component.css']
})
export class DepthComponent implements OnInit {

  textCtx = null;
  windowWidth = 0;
  windowHeight = 0;
  private container: ElementRef;

  renderWindow = vtkRenderWindow.newInstance();
  renderer = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4] });

  pointPoly = vtk({
    vtkClass: 'vtkPolyData',
    points: {
      vtkClass: 'vtkPoints',
      dataType: 'Float32Array',
      numberOfComponents: 3,
      values: [0, 0, -1],
    },
    polys: {
      vtkClass: 'vtkCellArray',
      dataType: 'Uint16Array',
      values: [1, 0],
    },
    pointData: {
      vtkClass: 'vtkDataSetAttributes',
      arrays: [
        {
          data: {
            vtkClass: 'vtkStringArray',
            name: 'pointLabels',
            dataType: 'string',
            values: ['Neo'],
          },
        },
      ],
    },
  });

  planePoly = vtk({
    vtkClass: 'vtkPolyData',
    points: {
      vtkClass: 'vtkPoints',
      dataType: 'Float32Array',
      numberOfComponents: 3,
      values: [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0],
    },
    polys: {
      vtkClass: 'vtkCellArray',
      dataType: 'Uint16Array',
      values: [3, 0, 1, 2, 3, 0, 2, 3],
    },
  });

  constructor(private elRef: ElementRef, private renderer2: Renderer2) { }

  ngOnInit(): void {
    this.container = this.elRef.nativeElement.querySelector('.block');

    this.renderWindow.addRenderer(this.renderer);

    const pointMapper = vtkSphereMapper.newInstance({ radius: 0.5 });
    const pointActor = vtkActor.newInstance();
    pointMapper.setInputData(this.pointPoly);
    pointActor.setMapper(pointMapper);

    const planeMapper = vtkMapper.newInstance();
    const planeActor = vtkActor.newInstance();
    planeMapper.setInputData(this.planePoly);
    planeActor.setMapper(planeMapper);

    const psMapper = vtkPixelSpaceCallbackMapper.newInstance();
    psMapper.setInputData(this.pointPoly);
    psMapper.setUseZValues(true);
    psMapper.setCallback((coordsList, camera, aspect, depthBuffer) => {
      if (this.textCtx && this.windowWidth > 0 && this.windowHeight > 0) {
        const dataPoints = psMapper.getInputData().getPoints();

        const viewMatrix = camera.getViewMatrix();
        mat4.transpose(viewMatrix, viewMatrix);
        const projMatrix = camera.getProjectionMatrix(aspect, -1, 1);
        mat4.transpose(projMatrix, projMatrix);

        this.textCtx.clearRect(0, 0, this.windowWidth, this.windowHeight);
        coordsList.forEach((xy, idx) => {
          const pdPoint = dataPoints.getPoint(idx);
          const vc = vec3.fromValues(pdPoint[0], pdPoint[1], pdPoint[2]);
          vec3.transformMat4(vc, vc, viewMatrix);
          vc[2] += 0.5; // sphere mapper's radius
          vec3.transformMat4(vc, vc, projMatrix);

          console.log(
            `Distance to camera: point = ${xy[2]}, depth buffer = ${xy[3]}`
          );
          if (vc[2] - 0.001 < xy[3]) {
            this.textCtx.font = '12px serif';
            this.textCtx.textAlign = 'center';
            this.textCtx.textBaseline = 'middle';
            this.textCtx.fillText(`p ${idx}`, xy[0], this.windowHeight - xy[1]);
          }
        });
        const activeCamera = this.renderWindow.getRenderers()[0].getActiveCamera();
        const crange = activeCamera.getClippingRange();
        console.log(`current clipping range: [${crange[0]}, ${crange[1]}]`);
      }
    });

    const textActor = vtkActor.newInstance();
    textActor.setMapper(psMapper);

    // ----------------------------------------------------------------------------
    // Add the actor to the renderer and set the camera based on it
    // ----------------------------------------------------------------------------

    this.renderer.addActor(pointActor);
    this.renderer.addActor(textActor);
    this.renderer.addActor(planeActor);

    this.resetCameraPosition();

    const openglRenderWindow = vtkOpenGLRenderWindow.newInstance();
    this.renderWindow.addView(openglRenderWindow);
    openglRenderWindow.setContainer(this.container);

    const textCanvas = this.renderer2.createElement('canvas');
    // textCanvas.classList.add(style.container, 'textCanvas');
    this.renderer2.addClass(textCanvas, 'textCanvas');
    const p2 = this.renderer2.createText('p2');
    this.renderer2.appendChild(textCanvas, p2);
    this.renderer2.appendChild(this.container, textCanvas);
    // container.appendChild(textCanvas);

    this.textCtx = textCanvas.getContext('2d');

    // ----------------------------------------------------------------------------
    // Setup an interactor to handle mouse events
    // ----------------------------------------------------------------------------

    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(openglRenderWindow);
    interactor.initialize();
    interactor.bindEvents(this.container);

    interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());
  }

  affine(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((val - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  resetCameraPosition(doRender: boolean = false): void {
    const activeCamera = this.renderWindow.getRenderers()[0].getActiveCamera();
    activeCamera.setPosition(0, 0, 3);
    activeCamera.setFocalPoint(0, 0, 0);
    activeCamera.setViewUp(0, 1, 0);
    activeCamera.setClippingRange(3.49999, 4.50001);

    if (doRender) {
      this.renderWindow.render();
    }
  }
}
