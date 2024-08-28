if (window.Vue) {
    Vue.component("st-waferplot", {
        name: "waferplot",
        template: `
        <div style="width: 100%; height: 300px; display: flex; position: relative;">
          <div ref="plotContainer" class="waferPlotContainer" style="width: 100%; height: 100%;">
          </div>
          <canvas ref="colorbarCanvas" v-show="!angle" style="position: absolute; right: 10px; top: 10px; bottom: 10px; width: 30px;"></canvas>
        </div>
      `,

        model: {
            prop: 'selectedCell',
            event: 'input'
        },

        props: {
            magnitude: { type: Array, required: true },
            angle: { type: Array, required: false },
            selectedCell: { type: Array, required: false },
        },

        data() {
            return {
                scene: null,
                camera: null,
                renderer: null,
                mainGroup: null,
                backgroundPlane: null,
                cellList: [],
                internalSelectedCell: this.selectedCell,
                selectedCellInstance: null,
                cubeSize: 1,
                colorbarCtx: null,
            };
        },

        methods: {
            renderPlot() {
                console.log('renderPlot', this.magnitude);
                this.cellList.forEach(cell => {
                    this.mainGroup.remove(cell);
                });
                this.cellList = [];

                if (this.backgroundPlane) {
                    this.scene.remove(this.backgroundPlane);
                }

                let margin = 0.1;
                let cubeSize = this.cubeSize;
                let dataSource = this.magnitude;
                let totalWidth = (dataSource[0].length - 1) * (cubeSize + margin);
                let totalHeight = (dataSource.length - 1) * (cubeSize + margin);
                let rows = dataSource;
                let zPos = 0;

                const planeGeometry = new THREE.PlaneGeometry(totalWidth + 2 * cubeSize, totalHeight + 2 * cubeSize);
                const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0 });
                this.backgroundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
                this.backgroundPlane.position.set(0, 0, -.01);
                this.scene.add(this.backgroundPlane);

                const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, 0.2);

                // Find min and max values for colorbar scaling
                let minValue = Math.min(...dataSource.flat());
                let maxValue = Math.max(...dataSource.flat());

                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    for (let j = 0; j < row.length; j++) {
                        let value = row[j];
                        let isOutsideCircleRadius = Math.sqrt(Math.pow(j - row.length / 2, 2) + Math.pow(i - rows.length / 2, 2)) >= dataSource.length * .5;
                        let color;
                        let x = j * (cubeSize + margin) - totalWidth / 2;
                        let y = i * (cubeSize + margin) - totalHeight / 2;

                        let cell = new THREE.Group();
                        this.mainGroup.add(cell);
                        cell.position.set(x, y, zPos);

                        cell.userData = { col: j, row: i, value: value, color: 0xff0000 };

                        let isSelectedCell = this.selectedCell && this.selectedCell[0] == j && this.selectedCell[1] == i;

                        if (this.angle) {
                            if (isOutsideCircleRadius) {
                                color = 0x000000;
                            } else {
                                color = isSelectedCell ? 0xffffff : 0x00ff00; // Green for quiver mode
                            }
                            cell.userData.color = color;

                            const arrowLength = cubeSize * 0.8 * Math.abs(value);
                            const arrowWidth = cubeSize * 0.2;

                            const arrowShape = new THREE.Shape();
                            arrowShape.moveTo(0, -arrowWidth / 2);
                            arrowShape.lineTo(arrowLength, 0);
                            arrowShape.lineTo(0, arrowWidth / 2);
                            arrowShape.lineTo(0, -arrowWidth / 2);

                            const geometryArrow = new THREE.ShapeGeometry(arrowShape);
                            const materialArrow = new THREE.MeshBasicMaterial({ color: color });
                            const arrow = new THREE.Mesh(geometryArrow, materialArrow);

                            arrow.rotation.z = this.angle[i][j];

                            arrow.position.set(0, 0, .1);
                            cell.add(arrow);
                        } else {
                            if (isOutsideCircleRadius) {
                                color = 0x000000;
                            } else {
                                // Interpolate color between blue (low values) and red (high values)
                                const normalizedValue = (value - minValue) / (maxValue - minValue);
                                const r = Math.floor(normalizedValue * 255);
                                const b = Math.floor((1 - normalizedValue) * 255);
                                color = (r << 16) | (b);

                                if (isSelectedCell) {
                                    color = 0xffffff; // White for selected cell
                                }
                            }
                            cell.userData.color = color;
                            const material = new THREE.MeshBasicMaterial({ color: color });
                            let cube = new THREE.Mesh(geometry, material);
                            cell.add(cube);
                        }

                        cell.callback = this.onCellClick.bind(this, cell);

                        this.cellList.push(cell);
                    }
                }

                this.camera.position.z = 17;

                this.renderer.render(this.scene, this.camera);
                if (!this.angle) {
                    this.renderColorbar(minValue, maxValue);
                }
            },

            renderColorbar(minValue, maxValue) {
                const canvas = this.$refs.colorbarCanvas;
                const ctx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;

                // Create gradient
                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, 'rgb(0, 0, 255)');  // Blue for low values
                gradient.addColorStop(1, 'rgb(255, 0, 0)');  // Red for high values

                // Fill background
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);

                // Add border
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, width, height);

                // Add labels
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(maxValue.toFixed(2), width - 5, 15);
                ctx.fillText(minValue.toFixed(2), width - 5, height - 5);
            },

            onCellClick(cell) {
                const value = cell.userData;
                this.internalSelectedCell = [value.col, value.row];
                console.log('value', value, this.internalSelectedCell);

                if (this.selectedCellInstance) {
                    const userData = this.selectedCellInstance.parent.userData;
                    this.selectedCellInstance.material.color.setHex(userData.color);
                }

                this.selectedCellInstance = cell.children[0];
                cell.children[0].material.color.setHex(0xffffff);
            },

            findClosestCell(mouse) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, this.camera);

                const intersects = raycaster.intersectObject(this.backgroundPlane);

                if (intersects.length > 0) {
                    const intersectPoint = intersects[0].point;
                    let minDist = Infinity;
                    let closestCell = null;

                    this.cellList.forEach(cell => {
                        const dist = cell.position.distanceTo(intersectPoint);
                        if (dist < minDist) {
                            minDist = dist;
                            closestCell = cell;
                        }
                    });

                    if (minDist <= this.cubeSize * 2) {
                        return closestCell;
                    }
                }

                return null;
            },

            onWindowResize() {
                this.camera.aspect = this.$refs.plotContainer.clientWidth / this.$refs.plotContainer.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.$refs.plotContainer.clientWidth, this.$refs.plotContainer.clientHeight);
                this.renderPlot();
            },
        },

        mounted() {
            console.log('wafer::mounted');
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, this.$refs.plotContainer.clientWidth / this.$refs.plotContainer.clientHeight, 0.1, 1000);
            this.renderer = new THREE.WebGLRenderer();
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(this.$refs.plotContainer.clientWidth, this.$refs.plotContainer.clientHeight);
            this.$refs.plotContainer.appendChild(this.renderer.domElement);

            this.mainGroup = new THREE.Group();
            this.scene.add(this.mainGroup);

            // Set up colorbar canvas
            const colorbarCanvas = this.$refs.colorbarCanvas;
            colorbarCanvas.width = 30;
            colorbarCanvas.height = this.$refs.plotContainer.clientHeight - 20;  // 20px for top and bottom margin

            this.renderer.domElement.addEventListener('click', (event) => {
                const rect = this.renderer.domElement.getBoundingClientRect();
                const mouse = new THREE.Vector2();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                const closestCell = this.findClosestCell(mouse);

                if (closestCell && closestCell.callback) {
                    closestCell.callback(closestCell);
                }
            });

            window.addEventListener('resize', this.onWindowResize);

            setTimeout(() => {
                this.onWindowResize();
            }, 100);
        },

        beforeDestroy() {
            window.removeEventListener('resize', this.onWindowResize);
        },

        watch: {
            magnitude() {
                this.renderPlot();
            },
            angle() {
                this.renderPlot();
            },
            internalSelectedCell(newVal) {
                console.log('internalSelectedCell', newVal);
                this.$emit('input', newVal);
            },
            selectedCell(newVal) {
                console.log('selectedCell', newVal);
                this.internalSelectedCell = newVal;
                this.renderPlot();
            }
        }
    });
} else {
    console.warn("Can't register custom component because Vue is not available");
}
