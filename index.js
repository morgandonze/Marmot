import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

import * as fs from 'fs';

function listHandler(options) {
  return () => p.select({
      message: 'Choose an item',
      initialValue: options[0].value,
      options: options
    });
}

function addHandler() {
  return () => p.text({
        message: "Add a new item",
        placeholder: "Enter an item..."
  })
}

function deleteHandler() {
}

function keepGoingHandler() {
    return () => 
      p.confirm({
          message: "Keep going?",
          initialValue: true,
      })
}

async function main() {
  // Read options from json file
  const data = fs.readFileSync('./data.json', 'utf-8');
  const options = JSON.parse(data);

  let keepGoing = true;
  let output;

  // Dialogue
  console.clear();

  while(keepGoing) {
    output = await keepGoingHandler()();
    keepGoing = (output == true);
  }

  // output = await addHandler(options)();

  // Add new option to list
  // options.push({"value": output, label: output})

  // Write to file
  // const updatedOptionsJson = JSON.stringify(options);
  // fs.writeFileSync('./newData.json', updatedOptionsJson);
}

main().catch(console.error)
