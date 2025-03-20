import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';

async function main() {
  p.intro(color.blue('Hello!'));

  await p.group(
    {
      list: () => p.select({
        message: 'Choose an item',
        initialValue: 'Apple',
        maxItems: 5,
        options: [
          {value: 'Apple', label: 'Apple'},
          {value: 'Banana', label: 'Banana'},
          {value: 'Cucumber', label: 'Cucumber'},
          {value: 'Dragonfruit', label: 'Dragonfruit'},
          {value: 'Eggplant', label: 'Eggplant'},
        ]
      })
    }
  )
}

main().catch(console.error)
