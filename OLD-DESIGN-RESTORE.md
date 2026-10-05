# Instrucciones rápidas para restaurar el diseño viejo

Si ya querés dejar la rama `old-design` con el diseño anterior, ejecutá esto en tu terminal local:

```bash
git checkout old-design
git reset --hard 5037b36c566eb7586a7434a52ea822c68ee64abf
git push --force-with-lease origin old-design
```

Si querés guardar una copia antes de hacerlo:

```bash
git checkout main
git checkout -b backup-current-design
git push origin backup-current-design
git checkout old-design
git reset --hard 5037b36c566eb7586a7434a52ea822c68ee64abf
git push --force-with-lease origin old-design
```

El commit usado es:
`5037b36c566eb7586a7434a52ea822c68ee64abf`

Es el punto que vimos como la versión previa al diseño actual.
