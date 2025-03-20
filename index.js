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

async function main() {
  // Read options from json file
  const data = fs.readFileSync('./data.json', 'utf-8');
  const options = JSON.parse(data);

  // Get input
  console.clear();
  const output = await addHandler(options)();

  // Add new option to list
  options.push({"value": output, label: output})

  // Write to file
  const updatedOptionsJson = JSON.stringify(options);
  fs.writeFileSync('./newData.json', updatedOptionsJson);
}

main().catch(console.error)
