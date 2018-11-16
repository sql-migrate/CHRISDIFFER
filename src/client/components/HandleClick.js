import React, { Component } from 'react';

// added function to change clicked element's background color
const handleClick = (event, diffDbColors, addScript, removeScript, setBackgroundColor, tableInfo, column) => {

  console.log('event ', event);
  console.log('diffDbColors ', diffDbColors);
  console.log('addScript ', addScript);
  console.log('removeScript ', removeScript);
  console.log('setBackgroundColor ', setBackgroundColor);
  console.log('tableInfo ', tableInfo);
  console.log('column ', column);
  event.stopPropagation();
  let id;
  let target;
  const { parentNode } = event.target;

  if (diffDbColors[event.target.id] !== undefined) {
    id = event.target.id;
    target = event.target;
  } else if (diffDbColors[parentNode.id] !== undefined) {
    id = parentNode.id;
    target = parentNode;
  }
  if (diffDbColors[id] !== undefined) {
    if (target.style.backgroundColor === diffDbColors[id]) {
      // Background color is set meaning change is selected.
      // Deselect change and remove query from script.
      setBackgroundColor(id);
      removeScript(id);
    } else {
      // Select change.
      setBackgroundColor(id);

      // Create query.
      // Determine type of query from id.
      const queryParams = id.split('-');

      // One query parameter means add or delete a table.
      if (queryParams.length === 1) {
        const { name, columns } = tableInfo;
        if (diffDbColors[id] === 'darkseagreen') {
          // Add a table.
          let columnString = '';

          // Build columns part of query.
          columns.forEach((column) => {
            const {
              name, dataType, isNullable, constraintTypes,
            } = column;

            columnString += `"${name}" ${dataType}`;

            // Add NOT NULL constraint if it exists.
            if (!isNullable) {
              columnString += ' NOT NULL';
            }

            if (constraintTypes !== undefined) {
              // Loop through and add all constraint types.
              constraintTypes.forEach((constraintType) => {
                if (constraintType.includes('REFERENCES')) {
                  const constraintTypeArray = constraintType.split(' ');
                  const foreignKey = ` ${constraintTypeArray[0]} ${constraintTypeArray[3]} (${constraintTypeArray[1]})`;
                  columnString += `${foreignKey}`;
                } else {
                  columnString += ` ${constraintType}`;
                }
              });
            }

            columnString += ', ';
          });

          // Remove last comma.
          columnString = columnString.slice(0, columnString.length - 2);

          // Add script to create a table.
          addScript(id, `CREATE TABLE ${name} (${columnString});`);
        } else if (diffDbColors[id] === 'indianred') {
          // Add script to delete a table.
          addScript(id, `DROP TABLE "${name}";\n/*  ALERT: THIS WILL ALSO CASCADE DELETE ALL ASSOCIATED DATA  */`);
        }
      }

      // Two query params means add or delete column from table
      if (queryParams.length === 2) {
        const {
          name, dataType, isNullable, constraintTypes,
        } = column;
        const tableName = tableInfo.name;
        let columnString = `ALTER TABLE "${tableName}" `;
        if (diffDbColors[id] === 'darkseagreen') {
          // Add a column
          columnString += `ADD COLUMN "${name}" ${dataType}`;

          // Add NOT NULL constraint if it exists.
          if (!isNullable) {
            columnString += ' NOT NULL';
          }

          if (constraintTypes !== undefined) {
            // Loop through and add all constraint types.
            constraintTypes.forEach((constraintType) => {
              if (constraintType.includes('REFERENCES')) {
                const constraintTypeArray = constraintType.split(' ');
                const foreignKey = ` ${constraintTypeArray[0]} ${constraintTypeArray[3]} (${constraintTypeArray[1]})`;
                columnString += `${foreignKey}`;
              } else {
                columnString += ` ${constraintType}`;
              }
            });
          }

          columnString += ';';

          addScript(id, columnString);
        } else {
          // Must be 'indianred' so delete a column
          addScript(id, `ALTER TABLE "${tableName}" DROP COLUMN "${name}";\n/*  ALERT: THIS WILL ALSO CASCADE DELETE ALL ASSOCIATED DATA  */`);
        }
      }

      // Four query params means add or delete data-type or constraint
      if (queryParams.length === 4) {
        const {
          name, dataType, constraintTypes, constraintNames,
        } = column;
        const tableName = tableInfo.name;
        console.log('qParams2', queryParams, 'column2', column, 'tableInfo2', tableInfo);
        // Add or remove a constraint.
        if (queryParams[2] === 'constraintType') {
          let columnString = `ALTER TABLE "${tableName}" `;

          if (diffDbColors[id] === 'darkseagreen') {
            // add a constraint
            columnString += 'ADD';

            if (queryParams[3].includes('REFERENCES')) {
              const constraintTypeArray = queryParams[3].split(' ');
              const foreignKey = ` FOREIGN KEY (${queryParams[1]}) REFERENCES ${constraintTypeArray[3]} (${constraintTypeArray[1]})`;

              columnString += `${foreignKey}`;
            } else {
              columnString += ` ${queryParams[3]} ("${name}");`;
            }
            addScript(id, columnString);
          } else {
            // remove a constraint
            columnString += `DROP "${constraintNames[constraintTypes.indexOf(queryParams[3])]}";`;
            addScript(id, columnString);
          }
        }

        // Modify a data type.
        if (queryParams[2] === 'dataType') {
          // add a dataType
          addScript(id, `ALTER TABLE "${tableName}" ALTER COLUMN "${name}" TYPE ${dataType} USING "${name}"::${dataType};`);
        }

        // Add or remove NOT NULL constraint.
        if (queryParams[2] === 'nullable') {
          if (diffDbColors[id] === 'darkseagreen') {
            // add a "NOT NULL"
            console.log('kill myself');
            addScript(id, `ALTER TABLE "${tableName}" ALTER COLUMN "${name}" SET NOT NULL;`);
          } else {
            // remove a "NOT NULL"
            console.log('die');
            addScript(id, `ALTER TABLE "${tableName}" ALTER COLUMN "${name}" DROP NOT NULL;`);
          }
        }
      }
    }
  }
};

export default handleClick;