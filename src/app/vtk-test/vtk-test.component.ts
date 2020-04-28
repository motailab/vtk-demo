import { Component, OnInit, ElementRef } from '@angular/core';

import 'vtk.js/Sources/favicon';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

@Component({
  selector: 'app-vtk-test',
  templateUrl: './vtk-test.component.html',
  styleUrls: ['./vtk-test.component.css']
})
export class VtkTestComponent implements OnInit {

  private renderWindow = vtkRenderWindow.newInstance();
  private renderer  = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4]});
  private coneSource = vtkConeSource.newInstance({ height: 1.0 });
  private mapper = vtkMapper.newInstance();
  private actor = vtkActor.newInstance();
  private openglRenderWindow = vtkOpenGLRenderWindow.newInstance();

  constructor(private el: ElementRef) { }

  ngOnInit(): void {
 
    const filter = vtkCalculator.newInstance();

    filter.setInputConnection(this.coneSource.getOutputPort());
    filter.setFormula({
      getArrays: inputDataSets => ({
        input: [],
        output: [
          { location: FieldDataTypes.CELL, name: 'Random', dataType: 'Float32Array', attribute: AttributeTypes.SCALARS },
        ],
      }),
      evaluate: (arraysIn, arraysOut) => {
        const [scalars] = arraysOut.map(d => d.getData());
        for (let i = 0; i < scalars.length; i++) {
          scalars[i] = Math.random();
        }
      },
    });

    this.mapper.setInputConnection(filter.getOutputPort());
    this.actor.setMapper(this.mapper);

    this.renderer.addActor(this.actor);
    this.renderer.resetCamera();
    this.renderWindow.render();

    this.renderWindow.addRenderer(this.renderer);
    this.renderWindow.addView(this.openglRenderWindow);

    const container = this.el.nativeElement.querySelector('.content');
    this.openglRenderWindow.setContainer(container);

    const {width, height} = container.getBoundingClientRect();
    this.openglRenderWindow.setSize(width, height);

    const interactor = vtkRenderWindowInteractor.newInstance();
    interactor.setView(this.openglRenderWindow);
    interactor.initialize();
    interactor.bindEvents(container);
    interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

  }


  representationSelector(e): void {
    const newRepValue = Number(e.target.value);
    this.actor.getProperty().setRepresentation(newRepValue);
    this.renderWindow.render();
  }

  resolutionChange(e): void {
    const resolution = Number(e.target.value);
    this.coneSource.setResolution(resolution);
    this.renderWindow.render();
  }
}
