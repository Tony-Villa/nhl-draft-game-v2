module.exports = async ({ github, context, issueNumber }) => {
  const { owner, repo } = context.repo;
  
  try {
    console.log(`Checking issue #${issueNumber}`);
    const issue = await github.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    
    // Check for UI label
    const hasUILabel = issue.data.labels.some(label => 
      label.name.toLowerCase().includes('ui') || 
      label.name.toLowerCase().includes('design')
    );

    console.log(`Has UI label: ${hasUILabel}`);
    
    if (!hasUILabel) {
      console.log("Issue does not have a UI label");
      return {
        hasUILabel: false,
        designerUsername: null
      };
    }
 
    const nodeIdResponse = await github.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
    
    const issueNodeId = nodeIdResponse.data.node_id;
    console.log(`Issue node ID: ${issueNodeId}`);
    
    // Query for the project item and its field values
    const graphqlQuery = `
    query {
      node(id: "${issueNodeId}") {
        ... on Issue {
          projectItems(first: 10) {
            nodes {
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                    text
                  }
                  ... on ProjectV2ItemFieldUserValue {
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                    users(first: 1) {
                      nodes {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;
    
    const graphqlResponse = await github.graphql(graphqlQuery);
    console.log("GraphQL response:", JSON.stringify(graphqlResponse, null, 2));
    
    // Process the response to find the designer
    let designerUsername = null;
    const projectItems = graphqlResponse.node.projectItems.nodes;
    
    for (const item of projectItems) {
      const fieldValues = item.fieldValues.nodes;
      for (const fieldValue of fieldValues) {
        // Check if this is our "Designer Attached" field
        const fieldName = fieldValue.field?.name;
        if (fieldName && fieldName.toLowerCase() === "designer attached") {
          if (fieldValue.text) {
            // For text fields that might contain @username format
            const match = fieldValue.text.match(/@([a-zA-Z0-9-]+)/);
            designerUsername = match ? match[1] : fieldValue.text;
          } else if (fieldValue.users?.nodes?.[0]?.login) {
            // For user fields that directly reference a GitHub user
            designerUsername = fieldValue.users.nodes[0].login;
          }
          console.log(`Found designer: ${designerUsername}`);
          break;
        }
      }
      if (designerUsername) break;
    }

    const result = {
      hasUILabel: true,
      designerUsername: designerUsername || null
    };
    
    console.log("Returning result:", JSON.stringify(result));
    return result;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return {
      hasUILabel: false,
      designerUsername: null
    };
  }
};