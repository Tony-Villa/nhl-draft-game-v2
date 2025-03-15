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
    
// First, we need to identify the projects this issue belongs to
    const projectsQuery = `
    query {
      node(id: "${issueNodeId}") {
        ... on Issue {
          projectsV2(first: 10) {
            nodes {
              id
              title
            }
          }
        }
      }
    }`;

    const projectsResponse = await github.graphql(projectsQuery);
    console.log("Projects:", JSON.stringify(projectsResponse, null, 2));

    // If we find projects, query the specific project fields for this issue
    if (projectsResponse.node.projectsV2.nodes.length > 0) {
      for (const project of projectsResponse.node.projectsV2.nodes) {
        console.log(`Checking project: ${project.title} (${project.id})`);
        
        // Now query the project items and their field values
        const projectItemQuery = `
        query {
          node(id: "${project.id}") {
            ... on ProjectV2 {
              items(first: 100) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      number
                    }
                  }
                  fieldValues(first: 100) {
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
                      ... on ProjectV2ItemFieldSingleSelectValue {
                        field {
                          ... on ProjectV2FieldCommon {
                            name
                          }
                        }
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }`;
    
        const projectItemResponse = await github.graphql(projectItemQuery);
        console.log("Project items:", JSON.stringify(projectItemResponse, null, 2));
        
        // Find the item for our specific issue
        const items = projectItemResponse.node.items.nodes;
        for (const item of items) {
          if (item.content && item.content.number === parseInt(issueNumber)) {
            console.log(`Found our issue (#${issueNumber}) in project!`);
            
            // Now check for the Designer Attached field
            const fieldValues = item.fieldValues.nodes;
            console.log("Field values:", JSON.stringify(fieldValues, null, 2));
            
            for (const fieldValue of fieldValues) {
              const fieldName = fieldValue.field?.name;
              console.log(`Field: ${fieldName}`);
              
              if (fieldName && fieldName.toLowerCase() === "designer attached") {
                // Handle different field types
                if (fieldValue.text) {
                  designerUsername = fieldValue.text.replace('@', '');
                } else if (fieldValue.users?.nodes?.[0]?.login) {
                  designerUsername = fieldValue.users.nodes[0].login;
                }
                
                console.log(`Found designer: ${designerUsername}`);
                break;
              }
            }
          }
        }
      }
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