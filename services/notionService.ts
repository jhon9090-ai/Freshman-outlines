import { StudyOutline, MainTopic, SubTopic, LearningObjective, RevisionAssistant, MCQ } from '../types';

const NOTION_API_VERSION = '2022-06-28';
// Using a CORS proxy to bypass browser-side API call restrictions.
const PROXY_URL = 'https://corsproxy.io/?';
const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

const parsePageId = (url: string): string => {
  try {
    const urlObject = new URL(url);
    const pathParts = urlObject.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    
    if (lastPart) {
      // A Notion page ID is a 32-character hexadecimal string. We find it in the last part of the URL path.
      const idMatch = lastPart.match(/[a-f0-9]{32}/);
      if (idMatch) {
        return idMatch[0];
      }
    }
    throw new Error('Could not extract a valid 32-character Page ID from the URL.');
  } catch (e) {
    console.error(e);
    throw new Error('Invalid Notion page URL. Please use the full URL for a page.');
  }
};

const textBlock = (content: string, annotations: any = {}) => ({
  rich_text: [{ type: 'text', text: { content }, annotations }]
});

const toNotionBlocks = (outline: StudyOutline): any[] => {
  const blocks: any[] = [];

  // Main Topics and Subtopics
  (outline.mainTopics || []).forEach(mainTopic => {
    blocks.push({ type: 'heading_1', heading_1: textBlock(mainTopic.title, { color: 'purple', bold: true }) });
    mainTopic.subtopics.forEach(subtopic => {
      blocks.push({
        type: 'toggle',
        toggle: {
          rich_text: [{ type: 'text', text: { content: subtopic.title }, annotations: { bold: true } }],
          color: 'blue_background',
          children: subtopic.learningObjectives.map(obj => ({
            type: 'to_do',
            to_do: { rich_text: [{ type: 'text', text: { content: obj.text } }], checked: false }
          }))
        }
      });
    });
    blocks.push({ type: 'divider', divider: {} }); // Divider after each main topic
  });

  // Revision Assistant
  const { revisionAssistant } = outline;
  if (revisionAssistant) {
    blocks.push({ type: 'heading_1', heading_1: textBlock('Revision Assistant', { color: 'pink', bold: true }) });

    if (revisionAssistant.focusAreas.length > 0) {
      blocks.push({ type: 'heading_2', heading_2: textBlock('🎯 Focus Areas', { color: 'blue' }) });
      revisionAssistant.focusAreas.forEach(area => {
        blocks.push({ type: 'bulleted_list_item', bulleted_list_item: textBlock(area) });
      });
    }

    if (revisionAssistant.keyDefinitions.length > 0) {
      blocks.push({ type: 'heading_2', heading_2: textBlock('🔑 Key Definitions', { color: 'green' }) });
      revisionAssistant.keyDefinitions.forEach(def => {
        blocks.push({
          type: 'callout',
          callout: {
            icon: { type: 'emoji', emoji: '💡' },
            rich_text: [
              { type: 'text', text: { content: `${def.term}: `, }, annotations: { bold: true } },
              { type: 'text', text: { content: def.definition } }
            ]
          }
        });
      });
    }

    if (revisionAssistant.quickFacts.length > 0) {
        blocks.push({ type: 'heading_2', heading_2: textBlock('⚡ Quick Facts', { color: 'orange' }) });
        revisionAssistant.quickFacts.forEach(fact => {
            blocks.push({ type: 'quote', quote: textBlock(`${fact.term}: ${fact.fact}`) });
        });
    }

    if (revisionAssistant.examQuestions.length > 0) {
      blocks.push({ type: 'heading_2', heading_2: textBlock('❓ Exam Questions', { color: 'red' }) });
      revisionAssistant.examQuestions.forEach((mcq, index) => {
        blocks.push({
          type: 'numbered_list_item',
          numbered_list_item: textBlock(mcq.question)
        });
        blocks.push({
          type: 'toggle',
          toggle: {
            ...textBlock('Show Answer & Explanation'),
            children: [
              {
                type: 'paragraph',
                paragraph: textBlock(`Correct Answer: ${mcq.options[mcq.correctAnswerIndex]}\nExplanation: ${mcq.explanation}`)
              }
            ]
          }
        });
      });
    }
  }

  return blocks;
};

export const exportToNotion = async (outline: StudyOutline, notionApiKey: string, parentPageUrl: string): Promise<string> => {
  if (!notionApiKey) {
    throw new Error('Notion API key is not configured in settings.');
  }

  const parentPageId = parsePageId(parentPageUrl);
  const allBlocks = toNotionBlocks(outline);
  const CHUNK_SIZE = 100;

  const headers = {
    'Authorization': `Bearer ${notionApiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_API_VERSION,
  };

  try {
    // Create the page with the first chunk of blocks
    const createPageResponse = await fetch(`${PROXY_URL}${NOTION_API_BASE_URL}/pages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: {
          title: {
            title: [{ type: 'text', text: { content: outline.title } }]
          }
        },
        children: allBlocks.slice(0, CHUNK_SIZE),
      }),
    });

    if (!createPageResponse.ok) {
        const errorData = await createPageResponse.json();
        throw new Error(`Notion API Error: ${errorData.message}. Make sure the integration is shared with the parent page.`);
    }

    const newPage = await createPageResponse.json();
    const newPageId = newPage.id;

    // Append remaining blocks in chunks
    for (let i = CHUNK_SIZE; i < allBlocks.length; i += CHUNK_SIZE) {
      const chunk = allBlocks.slice(i, i + CHUNK_SIZE);
      const appendResponse = await fetch(`${PROXY_URL}${NOTION_API_BASE_URL}/blocks/${newPageId}/children`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ children: chunk }),
      });
       if (!appendResponse.ok) {
        const errorData = await appendResponse.json();
        console.error("Failed to append block chunk:", errorData);
        throw new Error(`Notion API Error while appending content: ${errorData.message}`);
      }
    }
    
    return newPage.url;

  } catch (error) {
    console.error('Error exporting to Notion:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('An unexpected error occurred during Notion export.');
  }
};